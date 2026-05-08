"""Pydantic request / response shapes for /auth/* endpoints."""
from __future__ import annotations

from pydantic import BaseModel, Field


class EmailStartRequest(BaseModel):
    """POST /auth/email/start.

    `email` is intentionally `str` (not pydantic's `EmailStr`) because
    we never want a 422 response from this endpoint — bad-format input
    gets the same generic 200 as success, to deny attackers an
    enumeration oracle.
    """

    email: str


class EmailStartResponse(BaseModel):
    ok: bool = True


class EmailVerifyRequest(BaseModel):
    """POST /auth/email/verify.

    Exactly one of `code` (6 digits) or `link_token` (32-char base32)
    is required. Validation lives in the route so failure modes are
    uniform 400s.
    """

    email: str
    code: str | None = Field(default=None)
    link_token: str | None = Field(default=None)


class UserPublic(BaseModel):
    """Public-facing user shape. Never includes hashes or internal flags."""

    id: str
    email: str


class TokenResponse(BaseModel):
    """Returned by /auth/email/verify and /auth/refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserPublic


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class ClaimRequest(BaseModel):
    """POST /auth/claim — link prior anonymous owner_tokens to the
    authenticated user.
    """

    owner_tokens: list[str] = Field(default_factory=list)


class ClaimResponse(BaseModel):
    files_claimed: int
    jobs_claimed: int
