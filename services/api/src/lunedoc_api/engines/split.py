"""Split a PDF into multiple PDFs by 1-indexed page ranges.

Framework-free: takes Paths in, writes Paths out, returns the page
count of each output. Caller is responsible for storage I/O and DB
updates.
"""
from __future__ import annotations

from pathlib import Path

import pymupdf


class SplitError(ValueError):
    """Raised when input is not a readable PDF, or ranges are invalid."""


def _open_pdf(path: Path) -> pymupdf.Document:
    if not path.exists():
        raise SplitError(f"input file missing: {path.name}")
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # noqa: BLE001 — pymupdf throws various
        raise SplitError(f"could not open {path.name}: {exc}") from exc
    if not doc.is_pdf:
        doc.close()
        raise SplitError(f"{path.name} is not a PDF")
    return doc


def _write_range(src: pymupdf.Document, start_0: int, end_0: int, output_path: Path) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out = pymupdf.open()
    try:
        out.insert_pdf(src, from_page=start_0, to_page=end_0)
        out.save(str(output_path), garbage=4, deflate=True)
        return out.page_count
    finally:
        out.close()


def split_pdf_ranges(
    input_path: Path,
    ranges: list[tuple[int, int]],
    output_paths: list[Path],
) -> list[int]:
    """Split `input_path` into len(ranges) outputs, each spanning the
    1-indexed inclusive [start, end] range.

    Returns the page count of each output (parallel to `output_paths`).

    Raises:
        SplitError: missing/unreadable input, non-PDF input, malformed
                    ranges, or a range that exceeds the page count.
    """
    if not ranges:
        raise SplitError("ranges must be non-empty")
    if len(ranges) != len(output_paths):
        raise SplitError(
            f"output_paths length ({len(output_paths)}) "
            f"must match ranges length ({len(ranges)})"
        )

    src = _open_pdf(input_path)
    try:
        page_count = src.page_count
        # Validate every range against actual page count up-front so we
        # don't write half the outputs before discovering an error.
        for start, end in ranges:
            if start < 1 or end < 1:
                raise SplitError(f"ranges are 1-indexed; got [{start}, {end}]")
            if start > end:
                raise SplitError(f"range start must be <= end; got [{start}, {end}]")
            if end > page_count:
                raise SplitError(
                    f"range [{start}, {end}] exceeds page count {page_count}"
                )

        return [
            _write_range(src, s - 1, e - 1, p)
            for (s, e), p in zip(ranges, output_paths, strict=True)
        ]
    finally:
        src.close()


def split_pdf_per_page(input_path: Path, output_paths: list[Path]) -> int:
    """One output PDF per page of the input. Caller pre-allocates exactly
    `page_count` output paths.

    Returns the page count.

    Raises:
        SplitError: missing/unreadable input, non-PDF input, or output_paths
                    length doesn't match page count.
    """
    src = _open_pdf(input_path)
    try:
        page_count = src.page_count
        if len(output_paths) != page_count:
            raise SplitError(
                f"output_paths length ({len(output_paths)}) "
                f"must match page count ({page_count})"
            )
        for i, out_path in enumerate(output_paths):
            _write_range(src, i, i, out_path)
        return page_count
    finally:
        src.close()
