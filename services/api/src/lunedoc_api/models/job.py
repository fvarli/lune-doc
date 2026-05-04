"""Job model + Pydantic schemas.

A Job tracks an async tool execution (merge / split / watermark / …).
Phase 1 ships only `tool="merge"` but the table is shared across tools.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .file import Base

JobStatus = Literal["queued", "running", "done", "failed"]
JobTool = Literal["merge", "split", "watermark", "sign", "ocr", "edit", "compress", "convert"]


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tool: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    input_file_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    output_file_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    error: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    owner_token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class MergeJobRequest(BaseModel):
    """Body of POST /api/v1/jobs/merge."""

    file_ids: list[str] = Field(..., min_length=2, description="Two or more uploaded file_ids in merge order")


class JobStatusResponse(BaseModel):
    """Body of GET /api/v1/jobs/:id (status only)."""

    job_id: str
    tool: JobTool
    status: JobStatus
    input_file_ids: list[str]
    output_file_ids: list[str]
    error: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResultFile(BaseModel):
    file_id: str
    name: str
    mime: str
    size: int
    expires_at: datetime
    download_url: str


class JobResultResponse(BaseModel):
    """Body of GET /api/v1/jobs/:id/result (when status=done)."""

    job_id: str
    tool: JobTool
    status: JobStatus
    outputs: list[ResultFile]
