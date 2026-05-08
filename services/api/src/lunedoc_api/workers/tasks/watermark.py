"""Celery task: stamp a text watermark on every page of a PDF.

Reads the job row, resolves the single input File row, runs the
watermark engine, writes the output back through LocalDiskStorage as
a new File (inheriting the job's owner_token_hash), and updates the
job status.

Mirrors merge / split: queued → running → done|failed.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.watermark import WatermarkError, watermark_pdf
from ...models.file import File
from ...models.job import Job
from ...quota import decrement_active_jobs_sync, identity_for_job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.watermark")
def run_watermark_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("watermark: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        try:
            if len(job.input_file_ids) != 1:
                raise WatermarkError(
                    f"watermark expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise WatermarkError(f"input file {fid} not found")
            if f.mime != "application/pdf":
                raise WatermarkError(
                    f"input file {fid} is not a PDF (mime={f.mime})"
                )
            if f.owner_token_hash != job.owner_token_hash:
                raise WatermarkError(f"input file {fid} not owned by job")

            params = job.params or {}
            text = params.get("text")
            position = params.get("position", "center")
            opacity = float(params.get("opacity", 0.3))
            rotation = float(params.get("rotation", -30.0))
            if not text:
                raise WatermarkError("watermark text missing in job.params")

            input_path = storage._path_for(f.storage_key)
            output_id = str(uuid.uuid4())
            output_path = storage._path_for(output_id)

            page_count = watermark_pdf(
                input_path,
                output_path,
                text=text,
                position=position,
                opacity=opacity,
                rotation=rotation,
            )
            log.info(
                "watermark: job %s stamped %d pages with text=%r position=%s",
                job_id,
                page_count,
                text,
                position,
            )

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]
            output_size = output_path.stat().st_size

            new_file = File(
                id=output_id,
                name=f"watermarked-{short}.pdf",
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

        except WatermarkError as e:
            log.warning("watermark: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("watermark: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            decrement_active_jobs_sync(identity_for_job(job))

        return {"job_id": job_id, "status": job.status}
