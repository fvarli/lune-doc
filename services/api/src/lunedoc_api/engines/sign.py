"""Stamp a visible signature on a single PDF page.

This is **not** a cryptographic e-signature. It produces a visible
overlay (typed text or pasted image) only. Legal binding requires a
certified provider; we do not issue cryptographic signatures.

Framework-free: takes Paths in, writes Paths out. Caller is responsible
for storage I/O and DB updates.
"""
from __future__ import annotations

import base64
import binascii
import io
import re
from pathlib import Path
from typing import Literal

import pymupdf

SignMode = Literal["text", "image"]


class SignError(ValueError):
    """Raised when input is invalid or stamping fails."""


_DATA_URL_PREFIX = re.compile(r"^data:image/(?:png|jpeg|jpg);base64,", re.IGNORECASE)
# Magic bytes for PNG and JPEG
_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
_JPEG_MAGIC = b"\xff\xd8\xff"


def _decode_image_bytes(image_data: str) -> bytes:
    """Decode a base64 image payload (with or without data: prefix) to
    raw bytes. Validates that it's a real PNG or JPEG."""
    payload = _DATA_URL_PREFIX.sub("", image_data, count=1).strip()
    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise SignError(f"image_data is not valid base64: {exc}") from exc
    if not (raw.startswith(_PNG_MAGIC) or raw.startswith(_JPEG_MAGIC)):
        raise SignError("image_data is not a PNG or JPEG (magic bytes missing)")
    return raw


def _open_pdf(path: Path) -> pymupdf.Document:
    if not path.exists():
        raise SignError(f"input file missing: {path.name}")
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # noqa: BLE001
        raise SignError(f"could not open {path.name}: {exc}") from exc
    if not doc.is_pdf:
        doc.close()
        raise SignError(f"{path.name} is not a PDF")
    return doc


def sign_pdf(
    input_path: Path,
    output_path: Path,
    *,
    mode: SignMode,
    page: int,
    x: float,
    y: float,
    width: float,
    text: str | None = None,
    image_data: str | None = None,
) -> int:
    """Stamp a single signature onto `page` (1-indexed) of the PDF at
    `input_path`. Returns the total page count of the saved doc
    (preserved from the input).

    Coordinates are normalized: x/y/width are fractions of the page's
    width/height, origin top-left. The engine derives the height for
    `mode='image'` from the image's aspect ratio, and from font metrics
    for `mode='text'`.

    Raises:
        SignError: missing/unreadable input, non-PDF input, page out of
                   range, invalid rect, invalid image bytes, or the
                   wrong payload for the chosen mode.
    """
    if not (0.0 <= x <= 1.0):
        raise SignError(f"x must be in [0, 1]; got {x}")
    if not (0.0 <= y <= 1.0):
        raise SignError(f"y must be in [0, 1]; got {y}")
    if not (0.0 < width <= 1.0):
        raise SignError(f"width must be in (0, 1]; got {width}")
    if mode == "text":
        if not text:
            raise SignError("mode='text' requires non-empty text")
    elif mode == "image":
        if not image_data:
            raise SignError("mode='image' requires non-empty image_data")
    else:  # pragma: no cover — caught by Literal
        raise SignError(f"unknown sign mode: {mode!r}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = _open_pdf(input_path)
    try:
        if page < 1 or page > doc.page_count:
            raise SignError(
                f"page {page} out of range; document has {doc.page_count} pages"
            )

        target = doc[page - 1]
        rect = target.rect
        page_w, page_h = rect.width, rect.height

        # Convert normalized coords to PDF points (origin top-left).
        x_pt = x * page_w
        y_pt = y * page_h
        width_pt = width * page_w

        if mode == "text":
            assert text is not None  # already validated
            # Pick a font size that fits in width_pt. Helvetica-Italic
            # gives a slightly hand-written look without needing a
            # custom font file.
            font_size = max(10.0, min(width_pt / max(len(text), 1) * 1.6, 48.0))
            measured = pymupdf.get_text_length(text, fontname="hebo", fontsize=font_size)
            # If the measured width exceeds the box, shrink to fit.
            if measured > width_pt:
                font_size *= width_pt / measured
                font_size = max(8.0, font_size)

            # insert_text uses baseline-origin; move y down by ~font size
            # so the text sits inside the implied bounding box.
            target.insert_text(
                (x_pt, y_pt + font_size),
                text,
                fontsize=font_size,
                fontname="hebo",  # Helvetica-Bold (clearer than italic at low DPI)
                color=(0.1, 0.15, 0.45),
                fill_opacity=0.95,
                overlay=True,
            )

        else:  # image
            assert image_data is not None
            img_bytes = _decode_image_bytes(image_data)
            # Probe dimensions to derive height while preserving aspect ratio.
            try:
                img_doc = pymupdf.Pixmap(io.BytesIO(img_bytes))
            except Exception as exc:  # noqa: BLE001
                raise SignError(f"could not decode signature image: {exc}") from exc
            try:
                img_w, img_h = img_doc.width, img_doc.height
            finally:
                img_doc = None  # release

            if img_w <= 0 or img_h <= 0:
                raise SignError("signature image has zero dimensions")
            height_pt = width_pt * (img_h / img_w)
            target_rect = pymupdf.Rect(x_pt, y_pt, x_pt + width_pt, y_pt + height_pt)

            target.insert_image(target_rect, stream=img_bytes, overlay=True)

        doc.save(str(output_path), garbage=4, deflate=True)
        return doc.page_count
    finally:
        doc.close()
