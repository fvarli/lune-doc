"""Stub for /api/v1/auth/* — implemented in Phase 4."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post("/auth/email/start", summary="Email sign-in (Phase 4)")
@router.post("/auth/email/verify", summary="Verify email OTP (Phase 4)")
@router.post("/auth/oauth/google", summary="Google OAuth callback (Phase 4)")
@router.post("/auth/refresh", summary="Refresh access token (Phase 4)")
@router.post("/auth/logout", summary="Logout (Phase 4)")
@router.get("/auth/me", summary="Current user (Phase 4)")
async def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Phase 4 — auth endpoints not yet implemented",
    )
