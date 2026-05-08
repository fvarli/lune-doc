"""Refresh-token mint / rotate / revoke / reuse-detect.

Refresh tokens are opaque random URL-safe strings stored hashed
(HMAC-SHA256 with `AUTH_CHALLENGE_PEPPER`, the data-at-rest pepper).
Plaintext is returned to the client only at mint and rotate time.

Rotation is mandatory on every `/auth/refresh` call. Reuse of a
revoked token is a stolen-token signal and revokes every active
token for that user.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.refresh_token import RefreshToken
from ..settings import get_settings


def _hash(plaintext: str) -> str:
    pepper = get_settings().AUTH_CHALLENGE_PEPPER.encode("utf-8")
    return hmac.new(pepper, plaintext.encode("utf-8"), hashlib.sha256).hexdigest()


@dataclass(frozen=True)
class IssuedRefresh:
    """A freshly minted (or rotated) refresh token. The plaintext is
    only ever exposed here; subsequent hits load by `id` and use
    `_hash(plaintext)` for lookup.
    """

    plaintext: str
    row_id: str


async def mint_refresh_token(
    db: AsyncSession,
    *,
    user_id: str,
    parent_id: str | None = None,
    user_agent: str | None = None,
    ip: str | None = None,
) -> IssuedRefresh:
    settings = get_settings()
    plaintext = secrets.token_urlsafe(32)  # 256-bit entropy, ~43 chars
    now = datetime.now(timezone.utc)
    row = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=_hash(plaintext),
        parent_id=parent_id,
        issued_at=now,
        expires_at=now + timedelta(seconds=settings.REFRESH_TOKEN_TTL_SECONDS),
        user_agent=user_agent,
        ip=ip,
    )
    db.add(row)
    await db.flush()
    return IssuedRefresh(plaintext=plaintext, row_id=row.id)


@dataclass(frozen=True)
class RotateResult:
    """Outcome of `rotate_refresh_token`. `ok=False` covers all reject
    paths (unknown, expired, reuse-detected); the route always maps
    the failure to a generic 401."""

    ok: bool
    issued: IssuedRefresh | None = None
    user_id: str | None = None


async def rotate_refresh_token(
    db: AsyncSession,
    *,
    plaintext: str,
    user_agent: str | None = None,
    ip: str | None = None,
) -> RotateResult:
    """Validate `plaintext` and rotate it.

    On hit (active, non-expired, non-revoked): revokes the presented
    row, mints a successor with `parent_id` set, and stamps
    `replaced_by_id` on the old row.

    On reuse (presented row already revoked): revokes every active
    refresh token for that user — defense against stolen tokens.

    On miss / expired: returns ok=False.
    """
    if not plaintext:
        return RotateResult(ok=False)

    now = datetime.now(timezone.utc)
    row = (
        await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == _hash(plaintext))
        )
    ).scalar_one_or_none()
    if row is None:
        return RotateResult(ok=False)

    if row.revoked_at is not None:
        # Reuse-detection: revoke every active token for this user.
        await db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == row.user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await db.commit()
        return RotateResult(ok=False)

    if row.expires_at <= now:
        return RotateResult(ok=False)

    # Happy path: revoke + mint successor + link.
    row.revoked_at = now
    await db.flush()
    issued = await mint_refresh_token(
        db,
        user_id=row.user_id,
        parent_id=row.id,
        user_agent=user_agent,
        ip=ip,
    )
    row.replaced_by_id = issued.row_id
    await db.commit()
    return RotateResult(ok=True, issued=issued, user_id=row.user_id)


async def revoke_refresh_token_by_plaintext(
    db: AsyncSession, *, plaintext: str
) -> None:
    """Idempotent — no error on miss or already-revoked.

    Used by `POST /auth/logout`.
    """
    if not plaintext:
        return
    now = datetime.now(timezone.utc)
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == _hash(plaintext),
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )
    await db.commit()


async def revoke_refresh_token_by_id(
    db: AsyncSession, *, row_id: str
) -> None:
    """Idempotent — used when logout presents only the access token's
    `rt_id` claim and not the plaintext refresh token.
    """
    now = datetime.now(timezone.utc)
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.id == row_id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )
    await db.commit()
