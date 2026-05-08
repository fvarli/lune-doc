"""Pydantic shapes for /api/v1/me/* dashboard endpoints.

Kept distinct from `models.file.FileMetadata` and `models.job.JobStatusResponse`
so the dashboard list payloads can omit fields like `owner_token_hash`
explicitly and surface `params.result_meta` only (not the whole `params`
JSONB blob, which can carry edit-overlay payloads, OCR text, etc.).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from .job import JobStatus, JobTool


class MeJobItem(BaseModel):
    job_id: str
    tool: JobTool
    status: JobStatus
    input_file_ids: list[str]
    output_file_ids: list[str]
    error: str | None = None
    result_meta: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class MeJobsList(BaseModel):
    items: list[MeJobItem]
    limit: int
    offset: int
    total: int


class MeFileItem(BaseModel):
    file_id: str
    name: str
    mime: str
    size: int
    expires_at: datetime
    created_at: datetime


class MeFilesList(BaseModel):
    items: list[MeFileItem]
    limit: int
    offset: int
    total: int


class MeUsageResponse(BaseModel):
    """Lightweight account summary for the dashboard."""

    tier: Literal["free"] = "free"
    total_files: int = Field(..., ge=0)
    total_jobs: int = Field(..., ge=0)
    jobs_by_status: dict[str, int]
    jobs_by_tool: dict[str, int]
    ocr_pages_used_today: int = Field(..., ge=0)
