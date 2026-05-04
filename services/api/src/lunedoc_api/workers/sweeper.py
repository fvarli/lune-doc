"""TTL sweeper — Celery beat task.

Runs every 60 s. Deletes any `files` row whose `expires_at < now()`,
removes the corresponding storage object.

Sync code on purpose — Celery is sync by default, and the sweeper is a
single-shot batch operation, not a hot path.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select

from ..db import get_sync_session_factory
from ..models.file import File
from ..storage import get_storage
from .celery_app import celery_app

log = logging.getLogger(__name__)


@celery_app.task(name="lunedoc.sweep_expired_files")
def sweep_expired_files() -> dict:
    """Delete every File row + storage object whose expires_at has passed."""
    Session = get_sync_session_factory()
    storage = get_storage()
    now = datetime.now(timezone.utc)

    deleted = 0
    with Session() as db:
        rows = (
            db.execute(select(File).where(File.expires_at < now)).scalars().all()
        )
        for row in rows:
            try:
                storage.delete_sync(row.storage_key)
            except Exception as e:  # noqa: BLE001
                log.warning(
                    "sweeper: storage delete failed key=%s err=%s",
                    row.storage_key,
                    e,
                )
            db.delete(row)
            deleted += 1
        db.commit()

    if deleted:
        log.info("sweeper: deleted %d expired files", deleted)
    return {"deleted": deleted}
