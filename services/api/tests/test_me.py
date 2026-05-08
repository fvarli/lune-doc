"""GET /api/v1/me/* — authenticated dashboard endpoints."""
from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from datetime import datetime, timedelta, timezone

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from lunedoc_api.auth.email import CapturingEmailSender
from lunedoc_api.main import app
from lunedoc_api.models.file import File as FileRow
from lunedoc_api.models.job import Job
from lunedoc_api.routes.auth import get_email_sender


@pytest_asyncio.fixture
async def captured_sender(client: AsyncClient) -> AsyncIterator[CapturingEmailSender]:
    sender = CapturingEmailSender()
    app.dependency_overrides[get_email_sender] = lambda: sender
    yield sender
    app.dependency_overrides.pop(get_email_sender, None)


def _extract_code(body_text: str) -> str:
    for line in body_text.splitlines():
        s = line.strip()
        if s.isdigit() and len(s) == 6:
            return s
    raise AssertionError(body_text)


async def _signin(
    client: AsyncClient, captured: CapturingEmailSender, email: str = "alice@example.com"
) -> dict[str, str]:
    await client.post("/api/v1/auth/email/start", json={"email": email})
    code = _extract_code(captured.last.body_text)
    r = await client.post(
        "/api/v1/auth/email/verify", json={"email": email, "code": code}
    )
    assert r.status_code == 200
    return r.json()


def _bearer(tokens: dict) -> dict[str, str]:
    return {"authorization": f"Bearer {tokens['access_token']}"}


async def _seed_file(
    db: AsyncSession,
    *,
    user_id: str | None,
    name: str = "doc.pdf",
    mime: str = "application/pdf",
    size: int = 1024,
    ttl_seconds: int = 3600,
    created_offset_seconds: int = 0,
) -> FileRow:
    now = datetime.now(timezone.utc)
    row = FileRow(
        id=str(uuid.uuid4()),
        name=name,
        mime=mime,
        size=size,
        storage_key=str(uuid.uuid4()),
        owner_token_hash="x" * 64,
        user_id=user_id,
        status="uploaded",
        created_at=now + timedelta(seconds=created_offset_seconds),
        expires_at=now + timedelta(seconds=ttl_seconds),
    )
    db.add(row)
    await db.flush()
    return row


async def _seed_job(
    db: AsyncSession,
    *,
    user_id: str | None,
    tool: str = "merge",
    status: str = "done",
    params: dict | None = None,
    created_offset_seconds: int = 0,
) -> Job:
    now = datetime.now(timezone.utc)
    row = Job(
        id=str(uuid.uuid4()),
        tool=tool,
        status=status,
        input_file_ids=[],
        output_file_ids=[],
        params=params or {},
        error=None,
        owner_token_hash="x" * 64,
        user_id=user_id,
        created_at=now + timedelta(seconds=created_offset_seconds),
        updated_at=now + timedelta(seconds=created_offset_seconds),
    )
    db.add(row)
    await db.flush()
    return row


# --- Auth gating ----------------------------------------------------------


async def test_me_jobs_unauthenticated_returns_401(client: AsyncClient) -> None:
    r = await client.get("/api/v1/me/jobs")
    assert r.status_code == 401


async def test_me_files_unauthenticated_returns_401(client: AsyncClient) -> None:
    r = await client.get("/api/v1/me/files")
    assert r.status_code == 401


async def test_me_usage_unauthenticated_returns_401(client: AsyncClient) -> None:
    r = await client.get("/api/v1/me/usage")
    assert r.status_code == 401


# --- Isolation between users ---------------------------------------------


async def test_me_jobs_user_a_does_not_see_user_b_jobs(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender, email="alice@example.com")
    bob = await _signin(client, captured_sender, email="bob@example.com")

    await _seed_job(db, user_id=alice["user"]["id"], tool="merge")
    await _seed_job(db, user_id=bob["user"]["id"], tool="ocr")
    await db.commit()

    r = await client.get("/api/v1/me/jobs", headers=_bearer(alice))
    assert r.status_code == 200
    payload = r.json()
    assert payload["total"] == 1
    assert payload["items"][0]["tool"] == "merge"


async def test_me_files_user_a_does_not_see_user_b_files(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender, email="alice@example.com")
    bob = await _signin(client, captured_sender, email="bob@example.com")

    await _seed_file(db, user_id=alice["user"]["id"], name="alice.pdf")
    await _seed_file(db, user_id=bob["user"]["id"], name="bob.pdf")
    await db.commit()

    r = await client.get("/api/v1/me/files", headers=_bearer(alice))
    assert r.status_code == 200
    payload = r.json()
    assert payload["total"] == 1
    assert payload["items"][0]["name"] == "alice.pdf"


# --- Claim integration ---------------------------------------------------


async def test_me_jobs_returns_claimed_anonymous_jobs(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """Anonymous job rows promoted via /auth/claim must surface in /me/jobs."""
    alice = await _signin(client, captured_sender, email="alice@example.com")

    # Job lands anonymously, then a separate UPDATE simulates the claim
    # outcome (we don't go through the upload+claim path here — that's
    # exercised in test_auth_claim.py).
    job = await _seed_job(db, user_id=None)
    await db.execute(
        update(Job).where(Job.id == job.id).values(user_id=alice["user"]["id"])
    )
    await db.commit()

    r = await client.get("/api/v1/me/jobs", headers=_bearer(alice))
    assert r.status_code == 200
    assert r.json()["total"] == 1


async def test_me_files_returns_claimed_anonymous_files(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender, email="alice@example.com")
    f = await _seed_file(db, user_id=None)
    await db.execute(
        update(FileRow).where(FileRow.id == f.id).values(user_id=alice["user"]["id"])
    )
    await db.commit()

    r = await client.get("/api/v1/me/files", headers=_bearer(alice))
    assert r.json()["total"] == 1


# --- Filters / safety ----------------------------------------------------


async def test_me_files_excludes_expired_rows(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    await _seed_file(db, user_id=alice["user"]["id"], name="fresh.pdf", ttl_seconds=3600)
    await _seed_file(
        db, user_id=alice["user"]["id"], name="expired.pdf", ttl_seconds=-60
    )
    await db.commit()

    r = await client.get("/api/v1/me/files", headers=_bearer(alice))
    payload = r.json()
    assert payload["total"] == 1
    assert payload["items"][0]["name"] == "fresh.pdf"


async def test_me_files_response_omits_owner_token_hash(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    await _seed_file(db, user_id=alice["user"]["id"])
    await db.commit()

    r = await client.get("/api/v1/me/files", headers=_bearer(alice))
    assert r.status_code == 200
    item = r.json()["items"][0]
    assert "owner_token_hash" not in item
    assert "user_id" not in item
    assert "storage_key" not in item


async def test_me_jobs_response_omits_owner_token_hash(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    await _seed_job(db, user_id=alice["user"]["id"])
    await db.commit()

    r = await client.get("/api/v1/me/jobs", headers=_bearer(alice))
    item = r.json()["items"][0]
    assert "owner_token_hash" not in item
    assert "user_id" not in item


async def test_me_jobs_includes_result_meta_when_present(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    await _seed_job(
        db,
        user_id=alice["user"]["id"],
        tool="compress",
        params={
            "result_meta": {
                "engine": "ghostscript",
                "input_bytes": 12345,
                "output_bytes": 6789,
                "page_count": 4,
            }
        },
    )
    await db.commit()

    r = await client.get("/api/v1/me/jobs", headers=_bearer(alice))
    item = r.json()["items"][0]
    assert item["result_meta"] == {
        "engine": "ghostscript",
        "input_bytes": 12345,
        "output_bytes": 6789,
        "page_count": 4,
    }


async def test_me_jobs_returns_null_result_meta_when_absent(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    await _seed_job(db, user_id=alice["user"]["id"], tool="merge", params={})
    await db.commit()

    r = await client.get("/api/v1/me/jobs", headers=_bearer(alice))
    item = r.json()["items"][0]
    assert item["result_meta"] is None


# --- Pagination ----------------------------------------------------------


async def test_me_jobs_pagination_limit_offset(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    for i in range(5):
        await _seed_job(
            db,
            user_id=alice["user"]["id"],
            tool="merge",
            created_offset_seconds=i,
        )
    await db.commit()

    r1 = await client.get(
        "/api/v1/me/jobs?limit=2&offset=0", headers=_bearer(alice)
    )
    r2 = await client.get(
        "/api/v1/me/jobs?limit=2&offset=2", headers=_bearer(alice)
    )
    p1, p2 = r1.json(), r2.json()
    assert p1["total"] == 5 and p2["total"] == 5
    assert len(p1["items"]) == 2
    assert len(p2["items"]) == 2
    assert {i["job_id"] for i in p1["items"]} & {i["job_id"] for i in p2["items"]} == set()


async def test_me_files_pagination_limit_offset(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    for i in range(4):
        await _seed_file(
            db,
            user_id=alice["user"]["id"],
            name=f"f{i}.pdf",
            created_offset_seconds=i,
        )
    await db.commit()

    r = await client.get("/api/v1/me/files?limit=2&offset=1", headers=_bearer(alice))
    payload = r.json()
    assert payload["total"] == 4
    assert payload["limit"] == 2
    assert payload["offset"] == 1
    assert len(payload["items"]) == 2


async def test_me_jobs_total_independent_of_page_window(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    for i in range(7):
        await _seed_job(
            db, user_id=alice["user"]["id"], tool="merge", created_offset_seconds=i
        )
    await db.commit()

    r = await client.get("/api/v1/me/jobs?limit=3&offset=4", headers=_bearer(alice))
    payload = r.json()
    assert payload["total"] == 7  # not 3
    assert len(payload["items"]) == 3


async def test_me_jobs_limit_above_max_returns_422(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """`limit > 100` is rejected by FastAPI's Query(le=100) — 422."""
    tokens = await _signin(client, captured_sender)
    r = await client.get("/api/v1/me/jobs?limit=101", headers=_bearer(tokens))
    assert r.status_code == 422


# --- /me/usage -----------------------------------------------------------


async def test_me_usage_with_no_data_returns_zeros(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    r = await client.get("/api/v1/me/usage", headers=_bearer(alice))
    assert r.status_code == 200
    assert r.json() == {
        "tier": "free",
        "total_files": 0,
        "total_jobs": 0,
        "jobs_by_status": {},
        "jobs_by_tool": {},
        "ocr_pages_used_today": 0,
    }


async def test_me_usage_counts_files_jobs_status_and_tool(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender)
    await _seed_file(db, user_id=alice["user"]["id"])
    await _seed_file(db, user_id=alice["user"]["id"])
    await _seed_job(db, user_id=alice["user"]["id"], tool="merge", status="done")
    await _seed_job(db, user_id=alice["user"]["id"], tool="merge", status="done")
    await _seed_job(db, user_id=alice["user"]["id"], tool="ocr", status="failed")
    await _seed_job(db, user_id=alice["user"]["id"], tool="compress", status="running")
    await db.commit()

    r = await client.get("/api/v1/me/usage", headers=_bearer(alice))
    payload = r.json()
    assert payload["total_files"] == 2
    assert payload["total_jobs"] == 4
    assert payload["jobs_by_status"] == {"done": 2, "failed": 1, "running": 1}
    assert payload["jobs_by_tool"] == {"merge": 2, "ocr": 1, "compress": 1}


async def test_me_usage_excludes_other_users(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    alice = await _signin(client, captured_sender, email="alice@example.com")
    bob = await _signin(client, captured_sender, email="bob@example.com")

    # Bob has plenty of data — none of it should leak to alice's usage.
    for _ in range(3):
        await _seed_file(db, user_id=bob["user"]["id"])
    for _ in range(5):
        await _seed_job(db, user_id=bob["user"]["id"], tool="merge", status="done")
    await db.commit()

    r = await client.get("/api/v1/me/usage", headers=_bearer(alice))
    payload = r.json()
    assert payload["total_files"] == 0
    assert payload["total_jobs"] == 0


async def test_me_usage_tier_is_free(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)
    r = await client.get("/api/v1/me/usage", headers=_bearer(tokens))
    assert r.json()["tier"] == "free"


async def test_me_usage_ocr_pages_used_today_is_zero(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """Daily OCR-page tracking isn't implemented yet; endpoint returns 0."""
    tokens = await _signin(client, captured_sender)
    r = await client.get("/api/v1/me/usage", headers=_bearer(tokens))
    assert r.json()["ocr_pages_used_today"] == 0


async def test_me_usage_excludes_expired_files_in_count(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """total_files matches /me/files (which already filters expired)."""
    alice = await _signin(client, captured_sender)
    await _seed_file(db, user_id=alice["user"]["id"], ttl_seconds=3600)
    await _seed_file(db, user_id=alice["user"]["id"], ttl_seconds=-60)
    await db.commit()

    r = await client.get("/api/v1/me/usage", headers=_bearer(alice))
    assert r.json()["total_files"] == 1
