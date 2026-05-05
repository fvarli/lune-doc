"""Job model + Pydantic schemas.

A Job tracks an async tool execution (merge / split / watermark / …).
The table is shared across tools; per-tool config lives in `params`
(JSONB), and per-tool request bodies are validated by separate
Pydantic schemas (`MergeJobRequest`, `SplitJobRequest`, …).
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .file import Base

JobStatus = Literal["queued", "running", "done", "failed"]
JobTool = Literal["merge", "split", "watermark", "sign", "ocr", "edit", "compress", "convert"]
SplitMode = Literal["ranges", "per_page"]
WatermarkPosition = Literal[
    "center", "top-left", "top-right", "bottom-left", "bottom-right"
]
SignMode = Literal["text", "image"]
EditOpType = Literal["text_overlay", "highlight", "redact", "shape_rect"]


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


class WatermarkJobRequest(BaseModel):
    """Body of POST /api/v1/jobs/watermark.

    Stamps a text watermark on every page of `file_id`.
    """

    file_id: str = Field(..., description="Uploaded PDF file_id")
    text: str = Field(..., min_length=1, max_length=200, description="Watermark text")
    position: WatermarkPosition = Field(
        default="center",
        description="center | top-left | top-right | bottom-left | bottom-right",
    )
    opacity: float = Field(
        default=0.3,
        ge=0.1,
        le=1.0,
        description="0.1 (very faint) to 1.0 (fully opaque)",
    )
    rotation: float = Field(
        default=-30.0,
        ge=-180.0,
        le=180.0,
        description="Degrees, default -30 (diagonal up-left for center)",
    )


class SignJobRequest(BaseModel):
    """Body of POST /api/v1/jobs/sign.

    Stamps a **visible** signature on a single page. This is NOT a
    cryptographic e-signature — it's a typed-or-image overlay with no
    legal binding. Per docs/seo-tool-page-template.md honesty clauses.

    Coordinates are normalized to [0, 1] fractions of the target page's
    width/height. Origin is the top-left corner. The engine multiplies
    by the page dimensions before stamping. width is also normalized;
    height is derived from the source image's aspect ratio (mode=image)
    or font metrics (mode=text).
    """

    file_id: str = Field(..., description="Uploaded PDF file_id")
    mode: SignMode = Field(..., description="text | image")
    page: int = Field(..., ge=1, description="1-indexed page number")
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized left, 0–1")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized top, 0–1")
    width: float = Field(..., gt=0.0, le=1.0, description="Normalized width, (0, 1]")
    text: str | None = Field(
        default=None,
        max_length=200,
        description="Required when mode='text'",
    )
    image_data: str | None = Field(
        default=None,
        max_length=2_000_000,
        description=(
            "Required when mode='image'. Base64-encoded PNG or JPEG, "
            "with or without the 'data:image/png;base64,' prefix. "
            "Capped at ~2 MB encoded (~1.5 MB raw)."
        ),
    )

    @field_validator("text")
    @classmethod
    def _text_for_text_mode(cls, v: str | None) -> str | None:
        # Validation that depends on `mode` lives in model_validator below;
        # this just enforces non-empty when present.
        if v is not None and not v.strip():
            raise ValueError("text must not be empty")
        return v

    @model_validator(mode="after")
    def _check_mode_payload(self) -> "SignJobRequest":
        if self.mode == "text":
            if not self.text:
                raise ValueError("mode='text' requires non-empty `text`")
            if self.image_data:
                raise ValueError("mode='text' must not include `image_data`")
        else:  # image
            if not self.image_data:
                raise ValueError("mode='image' requires non-empty `image_data`")
            if self.text:
                raise ValueError("mode='image' must not include `text`")
        return self


class _EditBase(BaseModel):
    """Common fields for all Edit operations.

    Coordinates are normalized to [0, 1] fractions of the target page's
    width/height, origin top-left. width / height likewise normalized.
    """

    page: int = Field(..., ge=1)
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    width: float = Field(..., gt=0.0, le=1.0)


class EditTextOverlay(_EditBase):
    """Stamp visible text at the given rect."""

    type: Literal["text_overlay"]
    text: str = Field(..., min_length=1, max_length=500)


class EditHighlight(_EditBase):
    """Translucent colored rect on top of existing content."""

    type: Literal["highlight"]
    height: float = Field(..., gt=0.0, le=1.0)
    # 6-digit hex color "#rrggbb" or 3-digit "#rgb"; None → default yellow.
    color: str | None = Field(default=None)


class EditRedact(_EditBase):
    """True redaction — adds a redaction annotation, then `apply_redactions`
    removes the underlying text and content from the PDF stream."""

    type: Literal["redact"]
    height: float = Field(..., gt=0.0, le=1.0)


class EditShapeRect(_EditBase):
    """Visible rectangle drawn on top of the page (no content removal)."""

    type: Literal["shape_rect"]
    height: float = Field(..., gt=0.0, le=1.0)
    color: str | None = Field(default=None)


# Discriminated union — pydantic picks the right subclass off `type`.
EditOperation = Annotated[
    Union[EditTextOverlay, EditHighlight, EditRedact, EditShapeRect],
    Field(discriminator="type"),
]


class EditJobRequest(BaseModel):
    """Body of POST /api/v1/jobs/edit.

    Per docs/project-status.md D9: Edit is intentionally an
    overlay/redact editor, not Acrobat-style content reflow.
    """

    file_id: str = Field(..., description="Uploaded PDF file_id")
    operations: list[EditOperation] = Field(..., min_length=1)


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
