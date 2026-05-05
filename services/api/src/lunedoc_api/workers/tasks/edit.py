"""Celery task: apply a list of edit operations to a PDF.

Reads the job row, resolves the single input File, runs the edit
engine, writes one output File row inheriting owner_token_hash.

Same lifecycle as the other tools: queued → running → done | failed.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.edit import EditError, edit_pdf
from ...models.file import File
from ...models.job import Job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.edit")
def run_edit_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("edit: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        try:
            if len(job.input_file_ids) != 1:
                raise EditError(
                    f"edit expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise EditError(f"input file {fid} not found")
            if f.mime != "application/pdf":
                raise EditError(f"input file {fid} is not a PDF (mime={f.mime})")
            if f.owner_token_hash != job.owner_token_hash:
                raise EditError(f"input file {fid} not owned by job")

            params = job.params or {}
            operations = params.get("operations") or []
            if not operations:
                raise EditError("operations missing in job.params")

            input_path = storage._path_for(f.storage_key)
            output_id = str(uuid.uuid4())
            output_path = storage._path_for(output_id)

            page_count = edit_pdf(input_path, output_path, operations)
            log.info(
                "edit: job %s applied %d operation(s) to a %d-page doc",
                job_id,
                len(operations),
                page_count,
            )

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]
            output_size = output_path.stat().st_size

            new_file = File(
                id=output_id,
                name=f"edited-{short}.pdf",
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

        except EditError as e:
            log.warning("edit: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("edit: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            job.updated_at = datetime.now(timezone.utc)
            db.commit()

        return {"job_id": job_id, "status": job.status}
