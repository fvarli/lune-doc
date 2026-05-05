"""Apply a list of edit operations to a PDF.

Per docs/project-status.md D9: Edit is intentionally an overlay /
redact editor, not Acrobat-style content reflow. Four operation types:

  text_overlay  — visible text on top of the page
  highlight     — translucent colored rect on top of content
  redact        — true redaction (add annot + apply_redactions removes
                  underlying text and graphics from the PDF stream)
  shape_rect    — visible rectangle (no content removal)

Coordinates are normalized [0, 1] fractions of the target page's
width / height, origin top-left.

Framework-free: takes Paths in, writes Paths out, returns total page
count (preserved from input).
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

import pymupdf


class EditError(ValueError):
    """Raised when input is invalid or any operation fails to apply."""


# Default colors per op type (RGB 0–1).
_DEFAULT_HIGHLIGHT = (1.0, 0.92, 0.23)  # yellow
_DEFAULT_SHAPE = (0.18, 0.41, 0.79)  # accent blue
_REDACTION_FILL = (0.0, 0.0, 0.0)  # black


def _parse_color(hex_str: str | None, default: tuple[float, float, float]) -> tuple[float, float, float]:
    """Parse a `#rrggbb` or `#rgb` hex string into an (r, g, b) tuple in
    [0, 1]. Returns `default` on None or invalid input."""
    if hex_str is None:
        return default
    s = hex_str.strip().lstrip("#")
    if len(s) == 3:
        s = "".join(c * 2 for c in s)
    if len(s) != 6:
        return default
    try:
        r = int(s[0:2], 16) / 255.0
        g = int(s[2:4], 16) / 255.0
        b = int(s[4:6], 16) / 255.0
    except ValueError:
        return default
    return (r, g, b)


def _open_pdf(path: Path) -> pymupdf.Document:
    if not path.exists():
        raise EditError(f"input file missing: {path.name}")
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # noqa: BLE001
        raise EditError(f"could not open {path.name}: {exc}") from exc
    if not doc.is_pdf:
        doc.close()
        raise EditError(f"{path.name} is not a PDF")
    return doc


def _rect_for(
    op: dict[str, Any], page_w: float, page_h: float
) -> pymupdf.Rect:
    """Convert normalized (x, y, width[, height]) → PDF-points Rect."""
    x = float(op["x"])
    y = float(op["y"])
    w = float(op["width"])
    h = float(op.get("height", 0.0))
    x_pt = x * page_w
    y_pt = y * page_h
    w_pt = w * page_w
    h_pt = h * page_h if h > 0 else page_h * 0.04  # default ~one line
    return pymupdf.Rect(x_pt, y_pt, x_pt + w_pt, y_pt + h_pt)


def edit_pdf(
    input_path: Path,
    output_path: Path,
    operations: Iterable[dict[str, Any]],
) -> int:
    """Apply `operations` (in order) to the PDF at `input_path` and
    write the result to `output_path`. Returns the total page count.

    Each operation is a dict with a `type` key. Pages that received
    redactions get `apply_redactions()` called on them at the end so
    the underlying text is genuinely removed from the PDF stream.

    Raises EditError on any unrecoverable problem (missing input,
    non-PDF, page out of range, unknown op type, malformed coords).
    """
    ops = list(operations)
    if not ops:
        raise EditError("operations list is empty")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = _open_pdf(input_path)
    try:
        pages_with_redactions: set[int] = set()

        for i, op in enumerate(ops):
            op_type = op.get("type")
            page = op.get("page")
            if not isinstance(page, int) or page < 1:
                raise EditError(f"op {i} ({op_type}): invalid page {page!r}")
            if page > doc.page_count:
                raise EditError(
                    f"op {i} ({op_type}): page {page} exceeds page count "
                    f"{doc.page_count}"
                )

            target = doc[page - 1]
            rect = _rect_for(op, target.rect.width, target.rect.height)

            if op_type == "text_overlay":
                text = op.get("text") or ""
                if not text.strip():
                    raise EditError(f"op {i} (text_overlay): text is empty")
                # Auto-fit font size to width.
                font_size = max(10.0, min(rect.width / max(len(text), 1) * 1.5, 32.0))
                # Baseline-origin: nudge y down by ~font size to sit inside rect.
                target.insert_text(
                    (rect.x0, rect.y0 + font_size),
                    text,
                    fontsize=font_size,
                    fontname="hebo",
                    color=(0.05, 0.10, 0.35),
                    fill_opacity=1.0,
                    overlay=True,
                )

            elif op_type == "highlight":
                rgb = _parse_color(op.get("color"), _DEFAULT_HIGHLIGHT)
                target.draw_rect(
                    rect,
                    color=rgb,
                    fill=rgb,
                    fill_opacity=0.35,
                    overlay=True,
                )

            elif op_type == "redact":
                target.add_redact_annot(rect, fill=_REDACTION_FILL)
                pages_with_redactions.add(page - 1)

            elif op_type == "shape_rect":
                rgb = _parse_color(op.get("color"), _DEFAULT_SHAPE)
                target.draw_rect(
                    rect,
                    color=rgb,
                    fill=rgb,
                    fill_opacity=0.85,
                    width=1.0,
                    overlay=True,
                )

            else:
                raise EditError(f"op {i}: unknown type {op_type!r}")

        # Apply redactions per page so underlying text is genuinely removed
        # from the PDF stream — not just visually covered.
        for page_idx in pages_with_redactions:
            doc[page_idx].apply_redactions()

        doc.save(str(output_path), garbage=4, deflate=True)
        return doc.page_count
    finally:
        doc.close()
