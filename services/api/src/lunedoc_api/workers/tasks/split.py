"""Celery task: execute a split job.

Reads the job row, resolves the single input File row, runs the split
engine, writes each output back through LocalDiskStorage as a new
File (inheriting the job's owner_token_hash), and updates the job
status.

Mirrors the merge worker's lifecycle: queued → running → done|failed.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from ...db import get_sync_session_factory
from ...engines.split import SplitError, split_pdf_per_page, split_pdf_ranges
from ...models.file import File
from ...models.job import Job
from ...quota import decrement_active_jobs_sync, identity_for_job
from ...settings import get_settings
from ...storage import get_storage
from ..celery_app import celery_app

log = logging.getLogger(__name__)


def _safe_error(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"[:1024]


@celery_app.task(name="lunedoc.split")
def run_split_job(job_id: str) -> dict:
    Session = get_sync_session_factory()
    storage = get_storage()
    settings = get_settings()

    with Session() as db:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if job is None:
            log.warning("split: job %s missing at task start", job_id)
            return {"job_id": job_id, "status": "missing"}

        job.status = "running"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        try:
            if len(job.input_file_ids) != 1:
                raise SplitError(
                    f"split expects exactly 1 input, got {len(job.input_file_ids)}"
                )
            fid = job.input_file_ids[0]
            f = db.execute(select(File).where(File.id == fid)).scalar_one_or_none()
            if f is None:
                raise SplitError(f"input file {fid} not found")
            if f.mime != "application/pdf":
                raise SplitError(f"input file {fid} is not a PDF (mime={f.mime})")
            if f.owner_token_hash != job.owner_token_hash:
                raise SplitError(f"input file {fid} not owned by job")

            input_path = storage._path_for(f.storage_key)
            params = job.params or {}
            mode = params.get("mode")

            if mode == "ranges":
                ranges_raw = params.get("ranges") or []
                ranges: list[tuple[int, int]] = [
                    (int(r[0]), int(r[1])) for r in ranges_raw
                ]
                output_ids = [str(uuid.uuid4()) for _ in ranges]
                output_paths: list[Path] = [storage._path_for(o) for o in output_ids]
                page_counts = split_pdf_ranges(input_path, ranges, output_paths)

            elif mode == "per_page":
                # Need to know page_count up-front; open once via the engine
                # peek by passing an empty list — instead, do it inline.
                import pymupdf

                doc = pymupdf.open(input_path)
                try:
                    if not doc.is_pdf:
                        raise SplitError(f"input file {fid} is not a PDF")
                    page_count = doc.page_count
                finally:
                    doc.close()

                output_ids = [str(uuid.uuid4()) for _ in range(page_count)]
                output_paths = [storage._path_for(o) for o in output_ids]
                split_pdf_per_page(input_path, output_paths)
                page_counts = [1] * page_count

            else:
                raise SplitError(f"unknown split mode: {mode!r}")

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)
            short = job.id.replace("-", "")[:8]

            for idx, (out_id, out_path, _pages) in enumerate(
                zip(output_ids, output_paths, page_counts, strict=True), start=1
            ):
                size = out_path.stat().st_size
                new_file = File(
                    id=out_id,
                    name=f"split-{short}-{idx}.pdf",
                    mime="application/pdf",
                    size=size,
                    storage_key=out_id,
                    owner_token_hash=job.owner_token_hash,
                    status="uploaded",
                    created_at=now,
                    expires_at=expires_at,
                )
                db.add(new_file)

            job.output_file_ids = output_ids
            job.status = "done"
            job.error = None
            log.info(
                "split: job %s produced %d outputs (%d total pages)",
                job_id,
                len(output_ids),
                sum(page_counts),
            )

        except SplitError as e:
            log.warning("split: job %s failed: %s", job_id, e)
            job.status = "failed"
            job.error = _safe_error(e)
        except Exception as e:  # noqa: BLE001
            log.exception("split: job %s crashed", job_id)
            job.status = "failed"
            job.error = _safe_error(e)
        finally:
            job.updated_at = datetime.now(timezone.utc)
            db.commit()
            decrement_active_jobs_sync(identity_for_job(job))

        return {"job_id": job_id, "status": job.status}
