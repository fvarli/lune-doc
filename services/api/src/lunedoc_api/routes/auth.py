"""POST /api/v1/auth/* — email passwordless sign-in.

Phase 4 Step 1. Replaces the prior 501 stubs for `email/start` and
`email/verify`. Refresh, logout, /me, and /claim land in subsequent
steps; OAuth stays stubbed for a later phase.

No-leak invariants:
  - `email/start` always returns 200 {ok: true}: invalid format,
    unknown email, and rate-limit hits all look identical.
  - `email/verify` returns 400 generic for every failure (wrong
    code, expired, attempts-exhausted, disabled user, malformed).
"""
from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime, timezone

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.challenge import (
    create_challenge,
    is_valid_code_format,
    normalize_email,
    verify_challenge,
)
from ..auth.deps import get_current_user
from ..auth.email import EmailMessage, EmailSender, make_email_sender
from ..models.file import File as FileRow
from ..models.job import Job
from ..auth.jwt import InvalidToken, decode_access_token, encode_access_token
from ..auth.ratelimit import hit_and_check
from ..auth.refresh import (
    mint_refresh_token,
    revoke_refresh_token_by_id,
    revoke_refresh_token_by_plaintext,
    rotate_refresh_token,
)
from ..auth.schemas import (
    ClaimRequest,
    ClaimResponse,
    EmailStartRequest,
    EmailStartResponse,
    EmailVerifyRequest,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
    UserPublic,
)
from ..db import get_session
from ..models.user import User
from ..owner_token import hash_token, is_valid_format as is_valid_owner_token_format
from ..settings import get_settings

# `is_valid_owner_token_format` is the same check used for the link
# token format (32-char base32) — we generate link tokens via
# owner_token.generate(), so the format check is shared.
is_valid_link_token_format = is_valid_owner_token_format

router = APIRouter()
_log = logging.getLogger("lunedoc.auth")

_email_sender_singleton: EmailSender | None = None


def get_email_sender() -> EmailSender:
    """FastAPI dependency. Tests override via app.dependency_overrides."""
    global _email_sender_singleton
    if _email_sender_singleton is None:
        _email_sender_singleton = make_email_sender()
    return _email_sender_singleton


def _email_format_valid(email: str) -> bool:
    """Format-only check (no MX lookup). False on any error."""
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


def _client_ip(request: Request) -> str | None:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        # First entry is the original client per the convention.
        return fwd.split(",")[0].strip() or None
    if request.client:
        return request.client.host
    return None


def _ratelimit_email_key(email: str) -> str:
    """SHA-256 prefix — keeps Redis key non-PII while still unique."""
    return hashlib.sha256(email.encode("utf-8")).hexdigest()[:16]


_GENERIC_INVALID = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid")


@router.post(
    "/auth/email/start",
    response_model=EmailStartResponse,
    summary="Begin email passwordless sign-in",
)
async def email_start(
    body: EmailStartRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
    sender: EmailSender = Depends(get_email_sender),
) -> EmailStartResponse:
    """Sends a verification email containing both a magic link and a
    6-digit code. Always returns the same `{ok: true}` response.
    """
    settings = get_settings()
    email = normalize_email(body.email)
    request_ip = _client_ip(request)

    # Rate-limit BEFORE format check so a bad format doesn't dodge the limit.
    email_limited = await hit_and_check(
        f"auth:start:email:{_ratelimit_email_key(email)}:hour",
        limit=settings.EMAIL_START_RATE_PER_EMAIL_PER_HOUR,
        window_seconds=3600,
    )
    ip_limited = False
    if request_ip:
        ip_limited = await hit_and_check(
            f"auth:start:ip:{request_ip}:hour",
            limit=settings.EMAIL_START_RATE_PER_IP_PER_HOUR,
            window_seconds=3600,
        )

    if email_limited or ip_limited or not _email_format_valid(email):
        return EmailStartResponse()

    challenge = await create_challenge(db, email=email, request_ip=request_ip)
    await db.commit()

    link = (
        f"{settings.FRONTEND_BASE_URL.rstrip('/')}/auth/verify"
        f"?email={email}&token={challenge.link_token}"
    )
    minutes = settings.EMAIL_CHALLENGE_TTL_SECONDS // 60
    body_text = (
        "Sign in to lune-doc.\n\n"
        f"Click this link to sign in:\n{link}\n\n"
        f"Or enter this code in the app:\n  {challenge.code}\n\n"
        f"This link and code expire in {minutes} minutes."
    )
    await sender.send(
        EmailMessage(
            to=email,
            subject="Sign in to lune-doc",
            body_text=body_text,
        )
    )
    return EmailStartResponse()


@router.post(
    "/auth/email/verify",
    response_model=TokenResponse,
    summary="Verify email passwordless code or link",
)
async def email_verify(
    body: EmailVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    settings = get_settings()
    email = normalize_email(body.email)

    if (body.code is None) == (body.link_token is None):
        raise _GENERIC_INVALID
    if body.code is not None and not is_valid_code_format(body.code):
        raise _GENERIC_INVALID
    if body.link_token is not None and not is_valid_link_token_format(body.link_token):
        raise _GENERIC_INVALID

    res = await verify_challenge(
        db,
        email=email,
        code=body.code,
        link_token=body.link_token,
    )
    if not res.ok or res.email is None:
        raise _GENERIC_INVALID

    user = (
        await db.execute(select(User).where(User.email == res.email))
    ).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if user is None:
        user = User(
            id=str(uuid.uuid4()),
            email=res.email,
            email_verified_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        await db.flush()
    elif user.disabled_at is not None:
        raise _GENERIC_INVALID

    issued = await mint_refresh_token(
        db,
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
    )
    access = encode_access_token(
        sub=user.id,
        rt_id=issued.row_id,
        jti=str(uuid.uuid4()),
    )
    await db.commit()
    return TokenResponse(
        access_token=access,
        refresh_token=issued.plaintext,
        expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
        user=UserPublic(id=user.id, email=user.email),
    )


# --- Stubs for endpoints landing in subsequent steps ---


@router.post("/auth/oauth/google", summary="Google OAuth (later step)")
async def _oauth_google_stub() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="OAuth providers land in a later step",
    )


@router.post(
    "/auth/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token + new access token",
)
async def refresh_tokens(
    body: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Rotate the presented refresh token. Reuse of an already-revoked
    token is detected and revokes the entire chain for that user.
    """
    settings = get_settings()
    rotated = await rotate_refresh_token(
        db,
        plaintext=body.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
    )
    if not rotated.ok or rotated.issued is None or rotated.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid"
        )

    user = (
        await db.execute(select(User).where(User.id == rotated.user_id))
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid"
        )

    access = encode_access_token(
        sub=user.id,
        rt_id=rotated.issued.row_id,
        jti=str(uuid.uuid4()),
    )
    return TokenResponse(
        access_token=access,
        refresh_token=rotated.issued.plaintext,
        expires_in=settings.ACCESS_TOKEN_TTL_SECONDS,
        user=UserPublic(id=user.id, email=user.email),
    )


@router.post(
    "/auth/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a refresh token (idempotent)",
)
async def logout(
    body: LogoutRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> None:
    """Revokes the presented refresh token, or — if no refresh_token is
    supplied — the refresh row identified by the access token's `rt_id`
    claim. Always returns 204; never reveals whether the token existed.
    """
    if body.refresh_token:
        await revoke_refresh_token_by_plaintext(db, plaintext=body.refresh_token)
        return

    # Fallback: try the access-token Bearer path.
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        try:
            claims = decode_access_token(token)
        except InvalidToken:
            return  # silent, idempotent
        await revoke_refresh_token_by_id(db, row_id=claims.rt_id)


@router.get(
    "/auth/me",
    response_model=UserPublic,
    summary="Currently authenticated user",
)
async def me(user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic(id=user.id, email=user.email)


_CLAIM_MAX_TOKENS = 10


@router.post(
    "/auth/claim",
    response_model=ClaimResponse,
    summary="Link prior anonymous owner_tokens to the authenticated user",
)
async def claim_owner_tokens(
    body: ClaimRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> ClaimResponse:
    """Idempotent — `WHERE user_id IS NULL` filter prevents stealing
    rows already owned by another user. Caps at 10 tokens per call.
    """
    tokens: list[str] = list(body.owner_tokens or [])
    header_token = request.headers.get("x-owner-token")
    if header_token:
        tokens.append(header_token)

    # Drop format-invalid and dedupe.
    valid = [t for t in tokens if is_valid_owner_token_format(t)]
    valid = list(dict.fromkeys(valid))[:_CLAIM_MAX_TOKENS]
    if not valid:
        return ClaimResponse(files_claimed=0, jobs_claimed=0)

    hashes = [hash_token(t) for t in valid]

    files_res = await db.execute(
        FileRow.__table__.update()
        .where(
            FileRow.owner_token_hash.in_(hashes),
            FileRow.user_id.is_(None),
        )
        .values(user_id=user.id)
    )
    jobs_res = await db.execute(
        Job.__table__.update()
        .where(
            Job.owner_token_hash.in_(hashes),
            Job.user_id.is_(None),
        )
        .values(user_id=user.id)
    )
    await db.commit()

    return ClaimResponse(
        files_claimed=files_res.rowcount or 0,
        jobs_claimed=jobs_res.rowcount or 0,
    )
