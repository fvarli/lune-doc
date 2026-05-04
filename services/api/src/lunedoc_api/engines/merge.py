"""Merge multiple PDFs into one, preserving input order.

Framework-free: takes Paths, returns a page count. Caller is
responsible for storage I/O and DB updates.
"""
from __future__ import annotations

from pathlib import Path

import pymupdf


class MergeError(ValueError):
    """Raised when an input is not a readable PDF or merge fails."""


def merge_pdfs(input_paths: list[Path], output_path: Path) -> int:
    """Merge `input_paths` (in given order) into `output_path`.

    Returns the total page count of the merged document.

    Raises:
        MergeError: if fewer than 2 inputs, an input is missing,
                    cannot be opened, or is not a PDF.
    """
    if len(input_paths) < 2:
        raise MergeError("merge requires at least 2 input files")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    out = pymupdf.open()
    try:
        for path in input_paths:
            if not path.exists():
                raise MergeError(f"input file missing: {path.name}")

            try:
                doc = pymupdf.open(path)
            except Exception as exc:  # noqa: BLE001 — pymupdf throws various
                raise MergeError(f"could not open {path.name}: {exc}") from exc

            try:
                if not doc.is_pdf:
                    raise MergeError(f"{path.name} is not a PDF")
                out.insert_pdf(doc)
            finally:
                doc.close()

        # PyMuPDF needs garbage=4 + deflate to keep merged output compact;
        # without these the result roughly equals the sum of inputs.
        out.save(str(output_path), garbage=4, deflate=True)
        return out.page_count
    finally:
        out.close()
