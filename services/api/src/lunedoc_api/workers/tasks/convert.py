"""Celery task: convert a file between formats.

Reads the job row, resolves the single input File, picks the engine
path from the (from, to) pair, runs the engine, and creates one or
more output File rows (multi-output for PDF→images).

Same lifecycle as the other tools: queued → running → done | failed.
"""
from __future__ import annotations

import logging
import shutil
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.convert import ConvertError, convert_file
from ...models.file import File
from ...models.job import Job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)

_TO_MIME: dict[str, str] = {
    "PDF": "application/pdf",
    "JPG": "image/jpeg",
    "PNG": "image/png",
    "DOCX": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "XLSX": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "PPTX": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}
_TO_EXT: dict[str, str] = {
    "PDF": "pdf",
    "JPG": "jpg",
    "PNG": "png",
    "DOCX": "docx",
    "XLSX": "xlsx",
    "PPTX": "pptx",
}


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.convert")
def run_convert_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("convert: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        scratch: Path | None = None
        try:
            if len(job.input_file_ids) != 1:
                raise ConvertError(
                    f"convert expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise ConvertError(f"input file {fid} not found")
            if f.owner_token_hash != job.owner_token_hash:
                raise ConvertError(f"input file {fid} not owned by job")

            params = job.params or {}
            from_format = params.get("from_format")
            to_format = params.get("to_format")
            image_dpi = int(params.get("image_dpi", 150))
            if not from_format or not to_format:
                raise ConvertError("from_format/to_format missing in job.params")

            input_path = storage._path_for(f.storage_key)
            scratch = Path(tempfile.mkdtemp(prefix=f"convert-{job_id[:8]}-", dir="/tmp"))

            result = convert_file(
                input_path,
                scratch,
                from_format=from_format,
                to_format=to_format,
                image_dpi=image_dpi,
            )

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]
            mime = _TO_MIME[to_format]
            ext = _TO_EXT[to_format]

            output_ids: list[str] = []
            for idx, src_path in enumerate(result["output_paths"], start=1):
                output_id = str(uuid.uuid4())
                dst_path = storage._path_for(output_id)
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(src_path, dst_path)
                size = dst_path.stat().st_size

                if len(result["output_paths"]) == 1:
                    name = f"converted-{short}.{ext}"
                else:
                    name = f"converted-{short}-{idx:03d}.{ext}"

                new_file = File(
                    id=output_id,
                    name=name,
                    mime=mime,
                    size=size,
                    storage_key=output_id,
                    owner_token_hash=job.owner_token_hash,
                    status="uploaded",
                    created_at=now,
                    expires_at=expires_at,
                )
                db.add(new_file)
                output_ids.append(output_id)

            log.info(
                "convert: job %s engine=%s %s->%s outputs=%d",
                job_id,
                result["engine"],
                from_format,
                to_format,
                len(output_ids),
            )

            new_params = dict(params)
            new_params["result_meta"] = {
                "engine": result["engine"],
                "from_format": from_format,
                "to_format": to_format,
                "output_count": len(output_ids),
            }
            job.params = new_params
            job.output_file_ids = output_ids
            job.status = "done"
            job.error = None

        except ConvertError as e:
            log.warning("convert: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("convert: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            if scratch is not None:
                shutil.rmtree(scratch, ignore_errors=True)
            job.updated_at = datetime.now(timezone.utc)
            db.commit()

        return {"job_id": job_id, "status": job.status}
