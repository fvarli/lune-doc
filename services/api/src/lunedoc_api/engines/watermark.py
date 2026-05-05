"""Stamp a text watermark on every page of a PDF.

Framework-free: takes Paths in, writes Paths out, returns the page
count. Caller is responsible for storage I/O and DB updates.
"""
from __future__ import annotations

import math
from pathlib import Path
from typing import Literal

import pymupdf

WatermarkPosition = Literal[
    "center", "top-left", "top-right", "bottom-left", "bottom-right"
]


class WatermarkError(ValueError):
    """Raised when input is not a readable PDF or stamping fails."""


def _anchor_for(
    position: WatermarkPosition, page_w: float, page_h: float, margin: float
) -> tuple[float, float]:
    """Return the (x, y) anchor point for the watermark, in PDF page
    coordinates (origin top-left for PyMuPDF's text rotated insertion)."""
    if position == "center":
        return (page_w / 2, page_h / 2)
    if position == "top-left":
        return (margin, margin)
    if position == "top-right":
        return (page_w - margin, margin)
    if position == "bottom-left":
        return (margin, page_h - margin)
    if position == "bottom-right":
        return (page_w - margin, page_h - margin)
    # Should be unreachable thanks to the Literal type, but defensive.
    raise WatermarkError(f"unknown watermark position: {position!r}")


def watermark_pdf(
    input_path: Path,
    output_path: Path,
    *,
    text: str,
    position: WatermarkPosition = "center",
    opacity: float = 0.3,
    rotation: float = -30.0,
) -> int:
    """Stamp `text` on every page of the PDF at `input_path`. Returns
    the number of pages stamped (= page count).

    The watermark is drawn with PyMuPDF's `Page.insert_text` — the same
    text-rendering path used in the merge / split engines. Opacity is
    applied via PDF graphics state. Rotation is around the anchor.

    Raises:
        WatermarkError: missing/unreadable input, non-PDF input, or
                        invalid params that escaped pydantic.
    """
    if not input_path.exists():
        raise WatermarkError(f"input file missing: {input_path.name}")
    if not text:
        raise WatermarkError("watermark text must not be empty")
    if not (0.1 <= opacity <= 1.0):
        raise WatermarkError(f"opacity must be in [0.1, 1.0]; got {opacity}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        doc = pymupdf.open(input_path)
    except Exception as exc:  # noqa: BLE001
        raise WatermarkError(f"could not open {input_path.name}: {exc}") from exc

    try:
        if not doc.is_pdf:
            raise WatermarkError(f"{input_path.name} is not a PDF")

        # Font size scales with page diagonal so the watermark looks
        # roughly the same regardless of paper size.
        for page in doc:
            rect = page.rect
            page_w, page_h = rect.width, rect.height
            diag = math.hypot(page_w, page_h)
            font_size = max(20.0, diag * 0.06)
            margin = max(24.0, font_size * 0.6)

            anchor_x, anchor_y = _anchor_for(position, page_w, page_h, margin)

            # Center / right alignment around the anchor.
            text_width = pymupdf.get_text_length(text, fontsize=font_size)
            if position == "center":
                offset_x = -text_width / 2
                offset_y = font_size / 3
            elif position in ("top-right", "bottom-right"):
                offset_x = -text_width
                offset_y = 0.0
            else:
                offset_x = 0.0
                offset_y = 0.0

            # Build the text once at the origin, then place it on the page
            # via a (rotation × translation) matrix. TextWriter is the only
            # PyMuPDF path that accepts arbitrary rotation angles —
            # page.insert_text(rotate=…) is restricted to {0, 90, 180, 270}.
            writer = pymupdf.TextWriter(rect, opacity=opacity, color=(0.5, 0.5, 0.5))
            writer.append((0, 0), text, fontsize=font_size)

            mat = pymupdf.Matrix(rotation).pretranslate(
                anchor_x + offset_x, anchor_y + offset_y
            )
            writer.write_text(page, matrix=mat, opacity=opacity, overlay=True)

        doc.save(str(output_path), garbage=4, deflate=True)
        return doc.page_count
    finally:
        doc.close()
