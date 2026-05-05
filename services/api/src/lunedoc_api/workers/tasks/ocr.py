"""Celery task: run OCR on a PDF.

Reads the job row, resolves the single input File, runs the OCR
engine, writes one output File row inheriting owner_token_hash.

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
from ...engines.ocr import OcrError, ocr_pdf
from ...models.file import File
from ...models.job import Job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.ocr")
def run_ocr_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("ocr: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        scratch: Path | None = None
        try:
            if len(job.input_file_ids) != 1:
                raise OcrError(
                    f"ocr expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise OcrError(f"input file {fid} not found")
            if f.mime != "application/pdf":
                raise OcrError(f"input file {fid} is not a PDF (mime={f.mime})")
            if f.owner_token_hash != job.owner_token_hash:
                raise OcrError(f"input file {fid} not owned by job")

            params = job.params or {}
            mode = params.get("mode")
            lang = params.get("lang")
            if not mode or not lang:
                raise OcrError("mode/lang missing in job.params")

            input_path = storage._path_for(f.storage_key)
            scratch = Path(
                tempfile.mkdtemp(prefix=f"ocr-{job_id[:8]}-", dir="/tmp")
            )

            result = ocr_pdf(input_path, scratch, mode=mode, lang=lang)

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]

            output_id = str(uuid.uuid4())
            dst_path = storage._path_for(output_id)
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(result["output_path"], dst_path)
            output_size = dst_path.stat().st_size

            if mode == "extract":
                output_name = f"extracted-{short}.txt"
                output_mime = "text/plain"
            else:
                output_name = f"ocr-{short}.pdf"
                output_mime = "application/pdf"

            new_file = File(
                id=output_id,
                name=output_name,
                mime=output_mime,
                size=output_size,
                storage_key=output_id,
                owner_token_hash=job.owner_token_hash,
                status="uploaded",
                created_at=now,
                expires_at=expires_at,
            )
            db.add(new_file)

            new_params = dict(params)
            new_params["result_meta"] = {
                "engine": result["engine"],
                "mode": result["mode"],
                "lang": result["lang"],
                "page_count": result["page_count"],
            }
            job.params = new_params
            job.output_file_ids = [output_id]
            job.status = "done"
            job.error = None

            log.info(
                "ocr: job %s mode=%s lang=%s pages=%d -> %d bytes",
                job_id,
                mode,
                lang,
                result["page_count"],
                output_size,
            )

        except OcrError as e:
            log.warning("ocr: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("ocr: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            if scratch is not None:
                shutil.rmtree(scratch, ignore_errors=True)
            job.updated_at = datetime.now(timezone.utc)
            db.commit()

        return {"job_id": job_id, "status": job.status}
