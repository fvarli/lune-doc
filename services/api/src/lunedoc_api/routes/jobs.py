"""Stub for /api/v1/jobs/* — implemented in Phase 1."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post("/jobs/{tool}", summary="Create a job (Phase 1)")
@router.get("/jobs/{job_id}", summary="Get job status (Phase 1)")
@router.delete("/jobs/{job_id}", summary="Cancel a job (Phase 1)")
@router.get("/jobs/{job_id}/result", summary="Redirect to job result (Phase 1)")
async def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Phase 1 — tool endpoints not yet implemented",
    )
