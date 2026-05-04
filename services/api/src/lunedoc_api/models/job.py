"""Job model + Pydantic schemas.

A Job tracks an async tool execution (merge / split / watermark / …).
The table is shared across tools; per-tool config lives in `params`
(JSONB), and per-tool request bodies are validated by separate
Pydantic schemas (`MergeJobRequest`, `SplitJobRequest`, …).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .file import Base

JobStatus = Literal["queued", "running", "done", "failed"]
JobTool = Literal["merge", "split", "watermark", "sign", "ocr", "edit", "compress", "convert"]
SplitMode = Literal["ranges", "per_page"]


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tool: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    input_file_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    output_file_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    params: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    error: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    owner_token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class MergeJobRequest(BaseModel):
    """Body of POST /api/v1/jobs/merge."""

    file_ids: list[str] = Field(..., min_length=2, description="Two or more uploaded file_ids in merge order")


class SplitJobRequest(BaseModel):
    """Body of POST /api/v1/jobs/split.

    Two modes:
      - ranges: `ranges=[[start, end], …]` 1-indexed inclusive page ranges.
      - per_page: one output PDF per page; `ranges` is ignored.
    """

    file_id: str = Field(..., description="Uploaded PDF file_id to split")
    mode: SplitMode = Field(..., description="ranges | per_page")
    ranges: list[list[int]] | None = Field(
        default=None,
        description="Required when mode='ranges'. List of [start, end] 1-indexed inclusive ranges.",
    )

    @field_validator("ranges")
    @classmethod
    def _validate_ranges_shape(cls, v: list[list[int]] | None) -> list[list[int]] | None:
        if v is None:
            return v
        if len(v) == 0:
            raise ValueError("ranges must be non-empty when mode='ranges'")
        for r in v:
            if len(r) != 2:
                raise ValueError(f"each range must be [start, end] (got {r})")
            start, end = r
            if start < 1 or end < 1:
                raise ValueError(f"ranges are 1-indexed; got {r}")
            if start > end:
                raise ValueError(f"range start must be <= end; got {r}")
        return v


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
