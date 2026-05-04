"""Sweeper deletes expired rows + storage objects."""
from __future__ import annotations

import io
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select, update

from lunedoc_api.models.file import File
from lunedoc_api.workers.sweeper import sweep_expired_files

from .test_files import SAMPLE_PDF


@pytest.mark.asyncio
async def test_sweeper_deletes_expired(client: AsyncClient, db) -> None:  # type: ignore[no-untyped-def]
    # Upload via the API.
    resp = await client.post(
        "/api/v1/files",
        files={"file": ("hello.pdf", io.BytesIO(SAMPLE_PDF), "application/octet-stream")},
    )
    assert resp.status_code == 201
    file_id = resp.json()["file_id"]

    # Force-expire the row.
    past = datetime.now(timezone.utc) - timedelta(hours=2)
    await db.execute(update(File).where(File.id == file_id).values(expires_at=past))
    await db.commit()

    # Run the sweeper synchronously (no broker, no beat).
    result = sweep_expired_files()
    assert result["deleted"] == 1

    # Row should be gone.
    rows = (await db.execute(select(File).where(File.id == file_id))).scalars().all()
    assert rows == []
