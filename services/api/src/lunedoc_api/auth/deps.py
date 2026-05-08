"""FastAPI auth dependencies + ownership helper.

`get_current_user` requires a valid Bearer access token and a non-disabled
account, otherwise 401. `get_current_user_optional` returns None on
absence/invalid — used by routes that accept either Bearer or
`X-Owner-Token`.

`can_access` is the load-bearing helper for files/jobs ownership: it
codifies the rule that once a row has `user_id`, the owner_token alone
no longer grants access (claim is a one-way promotion).
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models.user import User
from ..owner_token import verify as verify_owner_token
from .jwt import InvalidToken, decode_access_token


def _extract_bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    if not auth:
        return None
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    return token or None


_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="invalid",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> User:
    """Required-auth dep. 401 on missing/invalid/expired/disabled."""
    token = _extract_bearer(request)
    if token is None:
        raise _UNAUTHORIZED
    try:
        claims = decode_access_token(token)
    except InvalidToken:
        raise _UNAUTHORIZED
    user = (
        await db.execute(select(User).where(User.id == claims.sub))
    ).scalar_one_or_none()
    if user is None or user.disabled_at is not None:
        raise _UNAUTHORIZED
    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> User | None:
    """Optional-auth dep. Returns None on any failure rather than 401.

    Used by routes that also accept `X-Owner-Token` for the anonymous
    flow.
    """
    token = _extract_bearer(request)
    if token is None:
        return None
    try:
        claims = decode_access_token(token)
    except InvalidToken:
        return None
    user = (
        await db.execute(select(User).where(User.id == claims.sub))
    ).scalar_one_or_none()
    if user is None or user.disabled_at is not None:
        return None
    return user


def can_access(
    row: object, *, user: User | None, owner_token: str | None
) -> bool:
    """True iff the caller may access `row` (a File or Job).

    `row` must expose `user_id` (str | None) and `owner_token_hash` (str).

    Truth table:
      row.user_id == user.id                    → allow
      row.user_id is set, user mismatch         → DENY (token alone insufficient)
      row.user_id is None, owner_token matches  → allow (anonymous flow unchanged)
      row.user_id is None, no/wrong token       → deny
    """
    row_user_id: str | None = getattr(row, "user_id", None)
    row_token_hash: str = getattr(row, "owner_token_hash")

    if row_user_id is not None:
        # Claimed: only the owning user can access. Owner-token alone
        # is no longer sufficient — this is the one-way promotion.
        return user is not None and user.id == row_user_id

    # Anonymous row: owner_token is the only path.
    return verify_owner_token(owner_token, row_token_hash)
