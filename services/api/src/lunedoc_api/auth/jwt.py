"""HS256 JWT access tokens — encode, decode, typed claims.

The decoder accepts a *list* of secrets. Step 1 supplies one; rotation
later swaps in a second secret without code changes (`JWT_SECRET` +
`JWT_SECRET_PREVIOUS` would feed both). Don't hard-code single-secret
verification — that's the rotation hook.

Refresh tokens are NOT JWTs. They are opaque, DB-backed strings (see
`auth/refresh.py`); only access tokens use this module.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import jwt as pyjwt

from ..settings import get_settings


class InvalidToken(Exception):
    """Raised on any decode failure — expired, bad signature, malformed,
    missing claims. Callers handle this as 401."""


@dataclass(frozen=True)
class AccessClaims:
    """Decoded access-token payload."""

    sub: str       # user.id
    rt_id: str     # refresh_tokens.id this access token belongs to
    jti: str       # unique token id (random)
    iat: int       # issued-at, unix seconds
    exp: int       # expiry, unix seconds


def _signing_secrets() -> list[str]:
    """List of acceptable signing secrets, primary first.

    Step 1: just `[JWT_SECRET]`. A future rotation adds the previous
    secret as the second element so in-flight tokens validate during
    the rollover window.
    """
    return [get_settings().JWT_SECRET]


def encode_access_token(
    *,
    sub: str,
    rt_id: str,
    jti: str,
    ttl_seconds: int | None = None,
) -> str:
    """Mint a signed access token for `sub` (user id)."""
    settings = get_settings()
    ttl = ttl_seconds if ttl_seconds is not None else settings.ACCESS_TOKEN_TTL_SECONDS
    now = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "sub": sub,
        "rt_id": rt_id,
        "jti": jti,
        "iat": now,
        "exp": now + ttl,
    }
    return pyjwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str, *, leeway_seconds: int = 10) -> AccessClaims:
    """Verify and decode. Raises InvalidToken on any failure.

    Tries each secret in turn; first valid match wins. Empty/None
    token immediately fails.
    """
    if not token:
        raise InvalidToken("empty token")
    settings = get_settings()
    last_err: Exception | None = None
    for secret in _signing_secrets():
        try:
            payload = pyjwt.decode(
                token,
                secret,
                algorithms=[settings.JWT_ALGORITHM],
                leeway=leeway_seconds,
            )
        except pyjwt.PyJWTError as exc:
            last_err = exc
            continue
        # Required claims; missing any → invalid.
        try:
            return AccessClaims(
                sub=str(payload["sub"]),
                rt_id=str(payload["rt_id"]),
                jti=str(payload["jti"]),
                iat=int(payload["iat"]),
                exp=int(payload["exp"]),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise InvalidToken(f"missing or malformed claim: {exc}") from exc
    raise InvalidToken(f"signature/expiry check failed: {last_err}")
