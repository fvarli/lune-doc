"""Celery task: stamp a visible signature on a single PDF page.

Reads the job row, resolves the single input File, runs the sign
engine, writes one output File row inheriting owner_token_hash.

Same lifecycle as merge / split / watermark: queued → running →
done | failed.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.sign import SignError, sign_pdf
from ...models.file import File
from ...models.job import Job
from ...quota import decrement_active_jobs_sync, identity_for_job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.sign")
def run_sign_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("sign: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        try:
            if len(job.input_file_ids) != 1:
                raise SignError(
                    f"sign expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise SignError(f"input file {fid} not found")
            if f.mime != "application/pdf":
                raise SignError(f"input file {fid} is not a PDF (mime={f.mime})")
            if f.owner_token_hash != job.owner_token_hash:
                raise SignError(f"input file {fid} not owned by job")

            params = job.params or {}
            mode = params.get("mode")
            page = int(params.get("page", 0))
            x = float(params.get("x", 0))
            y = float(params.get("y", 0))
            width = float(params.get("width", 0))
            text = params.get("text")
            image_data = params.get("image_data")

            input_path = storage._path_for(f.storage_key)
            output_id = str(uuid.uuid4())
            output_path = storage._path_for(output_id)

            page_count = sign_pdf(
                input_path,
                output_path,
                mode=mode,
                page=page,
                x=x,
                y=y,
                width=width,
                text=text,
                image_data=image_data,
            )
            log.info(
                "sign: job %s mode=%s page=%d (of %d)",
                job_id,
                mode,
                page,
                page_count,
            )

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]
            output_size = output_path.stat().st_size

            new_file = File(
                id=output_id,
                name=f"signed-{short}.pdf",
                mime="application/pdf",
                size=output_size,
                storage_key=output_id,
                owner_token_hash=job.owner_token_hash,
                status="uploaded",
                created_at=now,
                expires_at=expires_at,
            )
            db.add(new_file)

            job.output_file_ids = [output_id]
            job.status = "done"
            job.error = None

        except SignError as e:
            log.warning("sign: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("sign: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            decrement_active_jobs_sync(identity_for_job(job))

        return {"job_id": job_id, "status": job.status}
