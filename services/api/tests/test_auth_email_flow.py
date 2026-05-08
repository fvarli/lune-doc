"""Email passwordless flow — start + verify, including no-leak invariants.

Uses an overridden EmailSender to inspect the magic-link / code that
would otherwise go out via console.
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from lunedoc_api.auth.email import CapturingEmailSender, EmailMessage
from lunedoc_api.main import app
from lunedoc_api.models.auth_challenge import AuthChallenge
from lunedoc_api.models.refresh_token import RefreshToken
from lunedoc_api.models.user import User
from lunedoc_api.routes.auth import get_email_sender


@pytest_asyncio.fixture
async def captured_sender(client: AsyncClient) -> AsyncIterator[CapturingEmailSender]:
    """Override the EmailSender for the duration of a single test."""
    sender = CapturingEmailSender()
    app.dependency_overrides[get_email_sender] = lambda: sender
    yield sender
    app.dependency_overrides.pop(get_email_sender, None)


def _extract_code(msg: EmailMessage) -> str:
    """Pull the 6-digit code out of the dev email body."""
    for line in msg.body_text.splitlines():
        s = line.strip()
        if s.isdigit() and len(s) == 6:
            return s
    raise AssertionError(f"no 6-digit code in:\n{msg.body_text}")


def _extract_link_token(msg: EmailMessage) -> str:
    """Pull the link_token (32-char base32) out of the dev email body."""
    import re

    m = re.search(r"token=([A-Z2-7]{32})", msg.body_text)
    assert m is not None, f"no link token in:\n{msg.body_text}"
    return m.group(1)


async def test_start_creates_challenge_and_emails_link_and_code(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    r = await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    rows = (await db.execute(select(AuthChallenge))).scalars().all()
    assert len(rows) == 1

    msg = captured_sender.last
    assert msg.to == "alice@example.com"
    assert "Sign in to lune-doc" == msg.subject
    code = _extract_code(msg)
    link_token = _extract_link_token(msg)
    assert len(code) == 6 and code.isdigit()
    assert len(link_token) == 32


async def test_start_returns_identical_response_for_unknown_vs_known(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    """Once a user exists, subsequent starts must look identical to a
    fresh sign-in for an unknown email — no enumeration oracle.
    """
    db.add(
        User(
            id="known-user-1",
            email="known@example.com",
            email_verified_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    r1 = await client.post(
        "/api/v1/auth/email/start", json={"email": "known@example.com"}
    )
    r2 = await client.post(
        "/api/v1/auth/email/start", json={"email": "stranger@example.com"}
    )
    assert r1.status_code == r2.status_code == 200
    assert r1.json() == r2.json() == {"ok": True}


async def test_start_with_invalid_format_returns_200_no_email_sent(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    r = await client.post(
        "/api/v1/auth/email/start", json={"email": "not-an-email"}
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    assert captured_sender.messages == []


async def test_start_supersedes_prior_live_challenge(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    first_msg = captured_sender.last
    first_code = _extract_code(first_msg)

    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    second_msg = captured_sender.last
    second_code = _extract_code(second_msg)
    assert first_code != second_code

    # Verifying with the first code now fails because it was superseded.
    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": first_code},
    )
    assert r.status_code == 400


async def test_verify_with_correct_code_returns_tokens_and_creates_user(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code = _extract_code(captured_sender.last)

    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert r.status_code == 200
    payload = r.json()
    assert payload["token_type"] == "Bearer"
    assert payload["expires_in"] > 0
    assert isinstance(payload["access_token"], str) and payload["access_token"]
    assert isinstance(payload["refresh_token"], str) and payload["refresh_token"]
    assert payload["user"]["email"] == "alice@example.com"

    # User row created.
    user = (
        await db.execute(select(User).where(User.email == "alice@example.com"))
    ).scalar_one()
    assert user.email_verified_at is not None

    # Refresh token row created.
    rt_rows = (await db.execute(select(RefreshToken))).scalars().all()
    assert len(rt_rows) == 1


async def test_verify_with_correct_link_token_returns_tokens(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "bob@example.com"}
    )
    link_token = _extract_link_token(captured_sender.last)

    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "bob@example.com", "link_token": link_token},
    )
    assert r.status_code == 200


async def test_verify_wrong_code_returns_400_and_increments_attempts(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )

    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": "000000"},
    )
    assert r.status_code == 400

    row = (await db.execute(select(AuthChallenge))).scalar_one()
    assert row.attempts == 1


async def test_verify_returns_existing_user_on_repeat_signin(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    # First sign-in.
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code1 = _extract_code(captured_sender.last)
    r1 = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code1},
    )
    user_id_1 = r1.json()["user"]["id"]

    # Second sign-in — same user row.
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code2 = _extract_code(captured_sender.last)
    r2 = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code2},
    )
    assert r2.status_code == 200
    assert r2.json()["user"]["id"] == user_id_1


async def test_verify_disabled_user_rejected_with_generic_400(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code = _extract_code(captured_sender.last)

    # Pre-create the user with disabled_at set.
    db.add(
        User(
            id="disabled-1",
            email="alice@example.com",
            email_verified_at=datetime.now(timezone.utc),
            disabled_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert r.status_code == 400


async def test_verify_expired_challenge_returns_400(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code = _extract_code(captured_sender.last)

    await db.execute(
        update(AuthChallenge).values(
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)
        )
    )
    await db.commit()

    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert r.status_code == 400


async def test_verify_with_neither_code_nor_link_returns_400(
    client: AsyncClient,
) -> None:
    r = await client.post(
        "/api/v1/auth/email/verify", json={"email": "x@example.com"}
    )
    assert r.status_code == 400


async def test_verify_with_both_code_and_link_returns_400(
    client: AsyncClient,
) -> None:
    r = await client.post(
        "/api/v1/auth/email/verify",
        json={
            "email": "x@example.com",
            "code": "123456",
            "link_token": "A" * 32,
        },
    )
    assert r.status_code == 400


async def test_verify_consumed_challenge_rejected(
    client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code = _extract_code(captured_sender.last)

    r1 = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert r1.status_code == 200

    r2 = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert r2.status_code == 400


async def test_attempts_cap_blocks_correct_code(
    db: AsyncSession, client: AsyncClient, captured_sender: CapturingEmailSender
) -> None:
    await client.post(
        "/api/v1/auth/email/start", json={"email": "alice@example.com"}
    )
    code = _extract_code(captured_sender.last)

    # Force the row to attempts=5 (max).
    await db.execute(update(AuthChallenge).values(attempts=5))
    await db.commit()

    r = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "alice@example.com", "code": code},
    )
    assert r.status_code == 400
