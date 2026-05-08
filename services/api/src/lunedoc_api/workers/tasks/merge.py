"""Celery task: execute a merge job.

Reads the job row, resolves input File rows, runs the merge engine,
writes the merged PDF back through LocalDiskStorage as a new File
(inheriting the job's owner_token_hash so the user can download with
the same token), and updates the job status.

Sync code on purpose — Celery is sync by default and the engine work
(PyMuPDF) is CPU-bound, not IO-bound.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.merge import MergeError, merge_pdfs
from ...models.file import File
from ...models.job import Job
from ...quota import decrement_active_jobs_sync, identity_for_job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    msg = f"{type(exc).__name__}: {exc}"
    return msg[:1024]


@celery_app.task(name="lunedoc.merge")
def run_merge_job(job_id: str) -> dict:
    """Run a queued merge job to completion.

    The route layer creates the Job row in `queued` and enqueues this
    task. We move it through `running` → (`done` | `failed`).
    """
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("merge: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        # Mark running.
        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        try:
            input_files: list[File] = []
            for fid in job.input_file_ids:
                f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
                if f is None:
                    raise MergeError(f"input file {fid} not found")
                if f.mime != "application/pdf":
                    raise MergeError(f"input file {fid} is not a PDF (mime={f.mime})")
                if f.owner_token_hash != job.owner_token_hash:
                    # Should never happen — route verifies upfront, but defense
                    # in depth in case of state drift.
                    raise MergeError(f"input file {fid} not owned by job")
                input_files.append(f)

            input_paths = [storage._path_for(f.storage_key) for f in input_files]
            output_id = str(uuid.uuid4())
            output_path = storage._path_for(output_id)

            page_count = merge_pdfs(input_paths, output_path)
            log.info("merge: job %s produced %d pages", job_id, page_count)

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            output_size = output_path.stat().st_size

            new_file = File(
                id=output_id,
                name=f"merged-{output_id[:8]}.pdf",
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

        except MergeError as e:
            log.warning("merge: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001 — last-ditch
            log.exception("merge: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            decrement_active_jobs_sync(identity_for_job(job))

        return {"job_id": job_id, "status": job.status}
