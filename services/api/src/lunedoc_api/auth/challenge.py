"""Email-passwordless challenge generation, hashing, and verification.

A challenge row holds:
  - a 6-digit OTP code (visible in the verification email)
  - a 32-char base32 link token (embedded in the magic-link URL)
Both share one `attempts` counter so an attacker can't burn 5 codes
plus 5 link guesses on the same row.

Hashes use HMAC-SHA256 with `AUTH_CHALLENGE_PEPPER` — separate from
`OWNER_TOKEN_PEPPER` so the two secrets can rotate independently.
"""
from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.auth_challenge import AuthChallenge
from ..owner_token import generate as generate_link_token
from ..owner_token import is_valid_format as is_valid_link_token_format
from ..settings import get_settings

_CODE_FORMAT = re.compile(r"^\d{6}$")
PURPOSE_LOGIN = "login"


@dataclass(frozen=True)
class GeneratedChallenge:
    """Plaintext outputs of a fresh challenge — only ever returned once,
    at creation time, for the email body. The DB stores hashes.
    """

    code: str
    link_token: str


def _hash(value: str) -> str:
    pepper = get_settings().AUTH_CHALLENGE_PEPPER.encode("utf-8")
    return hmac.new(pepper, value.encode("utf-8"), hashlib.sha256).hexdigest()


def normalize_email(email: str) -> str:
    """Lowercase + strip. The DB column is citext (case-insensitive
    uniqueness as defense-in-depth) but we normalize at the boundary
    so application-level lookups are predictable across asyncpg's
    parameter-binding quirks.
    """
    return email.strip().lower()


def is_valid_code_format(code: str) -> bool:
    return bool(_CODE_FORMAT.fullmatch(code))


def _generate_code() -> str:
    """6-digit numeric, zero-padded. 1M possibilities."""
    return f"{secrets.randbelow(1_000_000):06d}"


async def create_challenge(
    db: AsyncSession,
    *,
    email: str,
    purpose: str = PURPOSE_LOGIN,
    request_ip: str | None = None,
) -> GeneratedChallenge:
    """Insert a fresh challenge row. Supersedes any prior live row
    for the same `(email, purpose)` by stamping `consumed_at = now()`,
    so a second `start` invalidates the first email.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=settings.EMAIL_CHALLENGE_TTL_SECONDS)

    code = _generate_code()
    link_token = generate_link_token()

    # Supersede prior live challenges (single statement, no race).
    await db.execute(
        update(AuthChallenge)
        .where(
            AuthChallenge.email == email,
            AuthChallenge.purpose == purpose,
            AuthChallenge.consumed_at.is_(None),
            AuthChallenge.expires_at > now,
        )
        .values(consumed_at=now)
    )

    row = AuthChallenge(
        id=str(uuid.uuid4()),
        email=email,
        purpose=purpose,
        code_hash=_hash(code),
        link_token_hash=_hash(link_token),
        attempts=0,
        expires_at=expires_at,
        request_ip=request_ip,
        created_at=now,
    )
    db.add(row)
    await db.flush()
    return GeneratedChallenge(code=code, link_token=link_token)


@dataclass(frozen=True)
class VerifyResult:
    """Outcome of verify_challenge. `email` is the normalized address
    used to mint subsequent tokens; only populated when ok is True.
    """

    ok: bool
    email: str | None = None


async def verify_challenge(
    db: AsyncSession,
    *,
    email: str,
    code: str | None = None,
    link_token: str | None = None,
    purpose: str = PURPOSE_LOGIN,
) -> VerifyResult:
    """Verify a code or link_token against the latest live challenge.

    Exactly one of `code` / `link_token` must be supplied. On miss,
    increments `attempts` (commits) and returns ok=False. On hit,
    stamps `consumed_at` (one-shot) and returns ok=True.

    All failure modes — wrong code, expired, attempts-exhausted, no
    challenge — return the same shape so callers can present a
    uniform 400 to clients.
    """
    if (code is None) == (link_token is None):
        # Exactly one must be set. Both or neither is a programming error.
        return VerifyResult(ok=False)
    if code is not None and not is_valid_code_format(code):
        return VerifyResult(ok=False)
    if link_token is not None and not is_valid_link_token_format(link_token):
        return VerifyResult(ok=False)

    settings = get_settings()
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(AuthChallenge)
        .where(
            AuthChallenge.email == email,
            AuthChallenge.purpose == purpose,
            AuthChallenge.consumed_at.is_(None),
            AuthChallenge.expires_at > now,
            AuthChallenge.attempts < settings.EMAIL_CHALLENGE_MAX_ATTEMPTS,
        )
        .order_by(AuthChallenge.expires_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        return VerifyResult(ok=False)

    expected_hash = row.code_hash if code is not None else row.link_token_hash
    presented = code if code is not None else link_token
    assert presented is not None  # validated above
    if not hmac.compare_digest(_hash(presented), expected_hash):
        row.attempts += 1
        await db.commit()
        return VerifyResult(ok=False)

    row.consumed_at = now
    await db.commit()
    return VerifyResult(ok=True, email=row.email)
