"""Files endpoints — integration with Bearer auth + owner_token.

Verifies the can_access truth table:
  - Anonymous flow (token only) still works after the refactor.
  - Signed-in user can read their claimed file with Bearer alone.
  - After claim, the owner_token alone no longer grants access (the
    one-way promotion / security boundary).
  - Other users cannot read a claimed file even with Bearer.
"""
from __future__ import annotations

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import AsyncClient

from lunedoc_api.auth.email import CapturingEmailSender
from lunedoc_api.main import app
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
    assert r.status_code == 201
    return r.json()


async def test_anonymous_owner_token_still_works_unchanged(
    client: AsyncClient,
) -> None:
    """Regression: the pre-Phase-4 anonymous flow remains intact."""
    upload = await _upload(client)
    r = await client.get(
        f"/api/v1/files/{upload['file_id']}",
        headers={"X-Owner-Token": upload["owner_token"]},
    )
    assert r.status_code == 200


async def test_signed_in_user_can_access_claimed_file_with_only_bearer(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    upload = await _upload(client)
    tokens = await _signin(client, captured_sender)

    # Claim.
    await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [upload["owner_token"]]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )

    # Bearer alone — no X-Owner-Token — works.
    r = await client.get(
        f"/api/v1/files/{upload['file_id']}",
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200


async def test_owner_token_alone_404s_after_claim(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """The security boundary: once claimed, owner_token alone is dead."""
    upload = await _upload(client)
    tokens = await _signin(client, captured_sender)
    await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [upload["owner_token"]]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )

    r = await client.get(
        f"/api/v1/files/{upload['file_id']}",
        headers={"X-Owner-Token": upload["owner_token"]},
    )
    assert r.status_code == 404


async def test_other_user_cannot_access_claimed_file(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    upload = await _upload(client)

    alice = await _signin(client, captured_sender, email="alice@example.com")
    await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [upload["owner_token"]]},
        headers={"authorization": f"Bearer {alice['access_token']}"},
    )

    bob = await _signin(client, captured_sender, email="bob@example.com")
    r = await client.get(
        f"/api/v1/files/{upload['file_id']}",
        headers={"authorization": f"Bearer {bob['access_token']}"},
    )
    assert r.status_code == 404


async def test_get_unknown_file_with_bearer_returns_404_no_leak(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)
    r = await client.get(
        "/api/v1/files/00000000-0000-0000-0000-000000000000",
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 404


async def test_signed_in_user_can_create_job_using_claimed_input_file(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """can_access threads correctly through job-creation input checks:
    a signed-in user with a claimed file may use it as a merge input
    even though the owner_token alone would be rejected.
    """
    u1 = await _upload(client)
    u2 = await _upload(client, owner_token=u1["owner_token"])

    tokens = await _signin(client, captured_sender)
    await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [u1["owner_token"]]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )

    # Both files are claimed by the user; merge with Bearer + owner_token works.
    r = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [u1["file_id"], u2["file_id"]]},
        headers={
            "authorization": f"Bearer {tokens['access_token']}",
            "X-Owner-Token": u1["owner_token"],
        },
    )
    assert r.status_code == 202


async def test_delete_claimed_file_anonymous_returns_204_but_no_op(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """DELETE keeps its idempotent 204 even when the row exists — the
    no-leak policy. The file must still be readable by the owner
    afterward (delete was a no-op).
    """
    upload = await _upload(client)
    tokens = await _signin(client, captured_sender)
    await client.post(
        "/api/v1/auth/claim",
        json={"owner_tokens": [upload["owner_token"]]},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )

    # Anonymous DELETE with the owner_token — silently ignored.
    r_del = await client.delete(
        f"/api/v1/files/{upload['file_id']}",
        headers={"X-Owner-Token": upload["owner_token"]},
    )
    assert r_del.status_code == 204

    # File still accessible to the owner.
    r_get = await client.get(
        f"/api/v1/files/{upload['file_id']}",
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r_get.status_code == 200
