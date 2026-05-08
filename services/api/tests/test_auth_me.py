"""GET /auth/me — required-auth endpoint."""
from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime, timezone

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from lunedoc_api.auth.email import CapturingEmailSender
from lunedoc_api.auth.jwt import encode_access_token
from lunedoc_api.main import app
from lunedoc_api.models.user import User
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


async def test_me_with_valid_bearer_returns_user(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)

    r = await client.get(
        "/api/v1/auth/me",
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json()["email"] == "alice@example.com"
    assert r.json()["id"] == tokens["user"]["id"]


async def test_me_without_bearer_returns_401(client: AsyncClient) -> None:
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


async def test_me_with_malformed_bearer_returns_401(client: AsyncClient) -> None:
    r = await client.get(
        "/api/v1/auth/me", headers={"authorization": "Bearer not.a.jwt"}
    )
    assert r.status_code == 401


async def test_me_with_non_bearer_scheme_returns_401(client: AsyncClient) -> None:
    r = await client.get(
        "/api/v1/auth/me", headers={"authorization": "Basic dXNlcjpwYXNz"}
    )
    assert r.status_code == 401


async def test_me_with_expired_bearer_returns_401(
    db: AsyncSession, client: AsyncClient
) -> None:
    """Mint an already-expired access token directly and present it."""
    db.add(
        User(
            id="exp-user",
            email="exp@example.com",
            email_verified_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    expired = encode_access_token(
        sub="exp-user", rt_id="rt-x", jti="jti-x", ttl_seconds=-3600
    )
    r = await client.get(
        "/api/v1/auth/me", headers={"authorization": f"Bearer {expired}"}
    )
    assert r.status_code == 401


async def test_me_with_token_for_unknown_user_returns_401(client: AsyncClient) -> None:
    """Token signature is valid but `sub` doesn't match any user row."""
    forged = encode_access_token(sub="ghost-user", rt_id="rt", jti="jti")
    r = await client.get(
        "/api/v1/auth/me", headers={"authorization": f"Bearer {forged}"}
    )
    assert r.status_code == 401


async def test_me_for_disabled_user_returns_401(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    tokens = await _signin(client, captured_sender)
    user_id = tokens["user"]["id"]

    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(disabled_at=datetime.now(timezone.utc))
    )
    await db.commit()

    r = await client.get(
        "/api/v1/auth/me",
        headers={"authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 401
