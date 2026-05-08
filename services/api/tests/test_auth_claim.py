"""POST /auth/claim — link anonymous owner_tokens to a user."""
from __future__ import annotations

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
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
    return r.json()


async def _upload(client: AsyncClient, owner_token: str | None = None) -> dict:
    """Upload a small PDF and return the upload response."""
    pdf_bytes = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 100 100]>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n"
        b"0000000056 00000 n\n0000000103 00000 n\n"
        b"trailer<</Root 1 0 R/Size 4>>\nstartxref\n160\n%%EOF\n"
    )
    headers = {}
    if owner_token:
        headers["X-Owner-Token"] = owner_token
    r = await client.post(
        "/api/v1/files",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


async def test_claim_with_no_bearer_returns_401(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/auth/claim", json={"owner_tokens": ["A" * 32]}
    )
    assert r.status_code == 401


async def test_claim_with_one_owner_token_attaches_files(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    # Anonymous upload first.
    upload = await _upload(client)
    owner_token = upload["owner_token"]

    # Sign in.
    tokens = await _signin(client, captured_sender)

    # Claim.
    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [owner_token]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json() == {"files_claimed": 1, "jobs_claimed": 0}

    # File row's user_id is now set.
    row = (
        await db.execute(select(FileRow).where(FileRow.id == upload["file_id"]))
    ).scalar_one()
    assert row.user_id == tokens["user"]["id"]


async def test_claim_idempotent_returns_zero_counts_second_time(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    upload = await _upload(client)
    tokens = await _signin(client, captured_sender)

    headers = {"authorization": f"Bearer {tokens['access_token']}"}
    r1 = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [upload["owner_token"]]},
        headers=headers,
    )
    assert r1.json() == {"files_claimed": 1, "jobs_claimed": 0}

    r2 = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [upload["owner_token"]]},
        headers=headers,
    )
    assert r2.json() == {"files_claimed": 0, "jobs_claimed": 0}


async def test_claim_does_not_steal_already_owned_rows(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """If a row already has a `user_id`, a different user's claim
    request must not overwrite it. Defense-in-depth via the
    `WHERE user_id IS NULL` filter.
    """
    upload = await _upload(client)
    owner_token = upload["owner_token"]

    # Alice signs in and claims first.
    alice = await _signin(client, captured_sender, email="alice@example.com")
    await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [owner_token]},
        headers={"authorization": f"Bearer {alice['access_token']}"},
    )

    # Bob signs in and tries to claim the same token.
    bob = await _signin(client, captured_sender, email="bob@example.com")
    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [owner_token]},
        headers={"authorization": f"Bearer {bob['access_token']}"},
    )
    assert r.json() == {"files_claimed": 0, "jobs_claimed": 0}

    row = (
        await db.execute(select(FileRow).where(FileRow.id == upload["file_id"]))
    ).scalar_one()
    assert row.user_id == alice["user"]["id"]


async def test_claim_unknown_owner_token_returns_zero_counts(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)

    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": ["A" * 32]},  # well-formed but unknown
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json() == {"files_claimed": 0, "jobs_claimed": 0}


async def test_claim_invalid_format_token_silently_ignored(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)

    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": ["not-a-valid-token"]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json() == {"files_claimed": 0, "jobs_claimed": 0}


async def test_claim_via_x_owner_token_header_works(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    upload = await _upload(client)
    tokens = await _signin(client, captured_sender)

    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": []},
        headers={
            "authorization": f"Bearer {tokens['access_token']}",
            "x-owner-token": upload["owner_token"],
        },
    )
    assert r.json() == {"files_claimed": 1, "jobs_claimed": 0}


async def test_claim_with_multiple_tokens_attaches_all(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    u1 = await _upload(client)
    u2 = await _upload(client)
    tokens = await _signin(client, captured_sender)

    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [u1["owner_token"], u2["owner_token"]]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.json() == {"files_claimed": 2, "jobs_claimed": 0}


async def test_claim_attaches_jobs_too(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """Anonymous user uploads + creates a merge job, then signs in and claims.
    Both files and the job should attach to the user.
    """
    u1 = await _upload(client)
    u2 = await _upload(client, owner_token=u1["owner_token"])
    owner_token = u1["owner_token"]

    # Create a merge job anonymously.
    r_job = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [u1["file_id"], u2["file_id"]]},
        headers={"X-Owner-Token": owner_token},
    )
    assert r_job.status_code == 202

    tokens = await _signin(client, captured_sender)
    r = await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [owner_token]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    payload = r.json()
    # 2 input files + 1 output file = 3 files; 1 job.
    # (Output file was created by the merge worker during the eager
    # task; it inherits the same owner_token_hash and is anonymous
    # until claimed.)
    assert payload["jobs_claimed"] == 1
    assert payload["files_claimed"] >= 2

    job_rows = (
        await db.execute(select(Job).where(Job.user_id == tokens["user"]["id"]))
    ).scalars().all()
    assert len(job_rows) == 1
