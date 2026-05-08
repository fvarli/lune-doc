"""Celery task: compress a PDF via Ghostscript (or PyMuPDF fallback).

Reads the job row, resolves the single input File, runs the compress
engine, writes one output File row inheriting owner_token_hash, and
records `engine` + byte counts in `job.params["result_meta"]` so the
frontend can render "Saved X MB (Y%)" without re-deriving from the
input metadata.

Same lifecycle as the other tools: queued → running → done | failed.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.compress import CompressError, compress_pdf
from ...models.file import File
from ...models.job import Job
from ...quota import decrement_active_jobs_sync, identity_for_job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.compress")
def run_compress_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("compress: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        try:
            if len(job.input_file_ids) != 1:
                raise CompressError(
                    f"compress expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise CompressError(f"input file {fid} not found")
            if f.mime != "application/pdf":
                raise CompressError(
                    f"input file {fid} is not a PDF (mime={f.mime})"
                )
            if f.owner_token_hash != job.owner_token_hash:
                raise CompressError(f"input file {fid} not owned by job")

            params = job.params or {}
            level = params.get("level", "medium")

            input_path = storage._path_for(f.storage_key)
            output_id = str(uuid.uuid4())
            output_path = storage._path_for(output_id)

            result = compress_pdf(input_path, output_path, level=level)
            log.info(
                "compress: job %s engine=%s level=%s %d -> %d bytes (%.1f%%)",
                job_id,
                result["engine"],
                level,
                result["input_bytes"],
                result["output_bytes"],
                100.0 * (1.0 - result["output_bytes"] / max(result["input_bytes"], 1)),
            )

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]

            new_file = File(
                id=output_id,
                name=f"compressed-{short}.pdf",
                mime="application/pdf",
                size=result["output_bytes"],
                storage_key=output_id,
                owner_token_hash=job.owner_token_hash,
                status="uploaded",
                created_at=now,
                expires_at=expires_at,
            )
            db.add(new_file)

            # Surface the engine + byte counts so the frontend can show
            # "Saved X MB (Y%)" without recomputing from upload metadata.
            new_params = dict(params)
            new_params["result_meta"] = {
                "engine": result["engine"],
                "input_bytes": result["input_bytes"],
                "output_bytes": result["output_bytes"],
                "page_count": result["page_count"],
            }
            job.params = new_params

            job.output_file_ids = [output_id]
            job.status = "done"
            job.error = None

        except CompressError as e:
            log.warning("compress: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("compress: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            decrement_active_jobs_sync(identity_for_job(job))

        return {"job_id": job_id, "status": job.status}
