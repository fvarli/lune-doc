"""POST /auth/refresh + POST /auth/logout."""
from __future__ import annotations

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lunedoc_api.auth.email import CapturingEmailSender
from lunedoc_api.main import app
from lunedoc_api.models.refresh_token import RefreshToken
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
    """Returns {access_token, refresh_token}."""
    await client.post("/api/v1/auth/email/start", json={"email": email})
    code = _extract_code(captured.last.body_text)
    r = await client.post(
        "/api/v1/auth/email/verify", json={"email": email, "code": code}
    )
    assert r.status_code == 200
    return r.json()


async def test_refresh_rotates_token_old_becomes_invalid(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)
    original_refresh = tokens["refresh_token"]

    r = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": original_refresh}
    )
    assert r.status_code == 200
    new_tokens = r.json()
    assert new_tokens["refresh_token"] != original_refresh
    assert new_tokens["access_token"] != tokens["access_token"]

    # Old refresh now rejected (revoked, not deleted — but unusable).
    r2 = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": original_refresh}
    )
    assert r2.status_code == 401


async def test_refresh_with_unknown_token_returns_401(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "definitely-not-a-real-token"}
    )
    assert r.status_code == 401


async def test_refresh_with_empty_token_returns_401(client: AsyncClient) -> None:
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": ""})
    assert r.status_code == 401


async def test_reuse_of_revoked_token_revokes_entire_chain(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """Stolen-refresh defense: presenting an already-revoked token
    revokes every active refresh token for that user.
    """
    tokens = await _signin(client, captured_sender)
    original_refresh = tokens["refresh_token"]

    # Legit rotation — original is now revoked, new one is active.
    r = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": original_refresh}
    )
    assert r.status_code == 200
    new_refresh = r.json()["refresh_token"]

    # Attacker presents the original (revoked). Should fail AND
    # revoke `new_refresh` (the entire chain).
    r2 = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": original_refresh}
    )
    assert r2.status_code == 401

    # The legitimate user's "new" token is now also revoked.
    r3 = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": new_refresh}
    )
    assert r3.status_code == 401


async def test_logout_revokes_refresh_token(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)

    r = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}
    )
    assert r.status_code == 204

    # Subsequent refresh fails.
    r2 = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert r2.status_code == 401


async def test_logout_idempotent_when_already_revoked(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)

    r1 = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}
    )
    assert r1.status_code == 204
    r2 = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}
    )
    assert r2.status_code == 204


async def test_logout_with_unknown_token_returns_204(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": "not-a-real-token"}
    )
    assert r.status_code == 204


async def test_logout_via_bearer_when_no_refresh_token_supplied(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """Body has no refresh_token; access token's rt_id claim is used."""
    tokens = await _signin(client, captured_sender)

    r = await client.post(
        "/api/v1/auth/logout",
        json={},
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 204

    rows = (await db.execute(select(RefreshToken))).scalars().all()
    assert len(rows) == 1
    assert rows[0].revoked_at is not None


async def test_logout_with_neither_body_token_nor_bearer_returns_204(
    client: AsyncClient,
) -> None:
    r = await client.post("/api/v1/auth/logout", json={})
    assert r.status_code == 204
