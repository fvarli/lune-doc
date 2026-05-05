"""Compress a PDF.

Two engines, picked at runtime:

  ghostscript  — subprocess to /usr/bin/gs with a PDFSETTINGS preset
                 (/screen | /ebook | /printer). Typical reduction
                 30–80 % on image-heavy PDFs. This is the standard
                 path used by every "real" PDF compressor.

  pymupdf      — fallback when `gs` isn't on PATH. Uses
                 doc.save(garbage=4, deflate=True, deflate_images=True,
                 deflate_fonts=True). Modest reduction (0–15 %) but
                 always available because we already ship PyMuPDF.

If the chosen engine somehow produces a *larger* output than the input
(rare, but happens with already-tiny PDFs), the engine ships the
original bytes through instead. The user never sees a "compressed"
file that's worse than what they uploaded.

Framework-free: takes Paths in, writes Paths out, returns a result
metadata dict. Caller is responsible for storage I/O and DB updates.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Literal, TypedDict

import pymupdf

CompressLevel = Literal["low", "medium", "high"]
CompressEngine = Literal["ghostscript", "pymupdf"]


_GS_PRESETS: dict[CompressLevel, str] = {
    "low": "/screen",     # ~72 dpi, smallest
    "medium": "/ebook",   # ~150 dpi, balanced (default)
    "high": "/printer",   # ~300 dpi, near-original
}


class CompressError(ValueError):
    """Raised when input is invalid or compression fails to run."""


class CompressResult(TypedDict):
    page_count: int
    input_bytes: int
    output_bytes: int
    engine: CompressEngine


# Resolve gs once at module load. None means "not available", path string
# means available. Tests that need to force the fallback path should
# monkeypatch this attribute.
_GS_PATH: str | None = shutil.which("gs")


def _resolve_gs_path() -> str | None:
    """Return the absolute path to `gs` if installed, else None."""
    return _GS_PATH


def _open_pdf(path: Path) -> pymupdf.Document:
    if not path.exists():
        raise CompressError(f"input file missing: {path.name}")
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # noqa: BLE001
        raise CompressError(f"could not open {path.name}: {exc}") from exc
    if not doc.is_pdf:
        doc.close()
        raise CompressError(f"{path.name} is not a PDF")
    return doc


def _run_ghostscript(
    gs_path: str, input_path: Path, output_path: Path, preset: str
) -> None:
    """Invoke Ghostscript with no shell, fixed argv, 120s timeout.

    Raises CompressError on timeout, non-zero exit, or unexpected
    OSError (e.g. binary suddenly missing between resolve and run).
    """
    args = [
        gs_path,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.5",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-dPDFSETTINGS={preset}",
        f"-sOutputFile={output_path}",
        str(input_path),
    ]
    try:
        subprocess.run(args, timeout=120, check=True, capture_output=True)
    except subprocess.TimeoutExpired as exc:
        raise CompressError("ghostscript timed out after 120s") from exc
    except subprocess.CalledProcessError as exc:
        # stderr can be huge; clamp to a safe size for job.error storage.
        stderr = (exc.stderr or b"").decode("utf-8", errors="replace")[:500]
        raise CompressError(
            f"ghostscript exited {exc.returncode}: {stderr}"
        ) from exc
    except OSError as exc:
        raise CompressError(f"ghostscript invocation failed: {exc}") from exc


def _save_pymupdf(input_path: Path, output_path: Path) -> None:
    doc = _open_pdf(input_path)
    try:
        doc.save(
            str(output_path),
            garbage=4,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
        )
    finally:
        doc.close()


def compress_pdf(
    input_path: Path,
    output_path: Path,
    *,
    level: CompressLevel = "medium",
) -> CompressResult:
    """Compress `input_path` and write to `output_path`.

    Always validates the input is a real PDF before dispatching. Picks
    the Ghostscript path when available, otherwise PyMuPDF. Guarantees
    output_bytes ≤ input_bytes (copies the original through if the
    chosen engine produced a larger file).
    """
    if level not in _GS_PRESETS:
        raise CompressError(f"unknown compression level: {level!r}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Validate input is a PDF + grab page count for the result metadata.
    doc = _open_pdf(input_path)
    try:
        page_count = doc.page_count
    finally:
        doc.close()

    input_bytes = input_path.stat().st_size

    gs_path = _resolve_gs_path()
    if gs_path is not None:
        _run_ghostscript(gs_path, input_path, output_path, _GS_PRESETS[level])
        engine: CompressEngine = "ghostscript"
    else:
        _save_pymupdf(input_path, output_path)
        engine = "pymupdf"

    output_bytes = output_path.stat().st_size

    # No-regression guarantee: if we somehow made it bigger, ship the
    # original instead.
    if output_bytes > input_bytes:
        output_path.write_bytes(input_path.read_bytes())
        output_bytes = output_path.stat().st_size

    return {
        "page_count": page_count,
        "input_bytes": input_bytes,
        "output_bytes": output_bytes,
        "engine": engine,
    }
