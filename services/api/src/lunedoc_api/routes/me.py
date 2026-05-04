"""Stub for /api/v1/me/* — implemented in Phase 4."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get("/me/jobs", summary="My job history (Phase 4)")
@router.get("/me/files", summary="My files (Phase 4)")
@router.get("/me/usage", summary="My usage / quota (Phase 4)")
async def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Phase 4 — dashboard endpoints not yet implemented",
    )
