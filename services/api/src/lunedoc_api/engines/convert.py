"""Convert files between formats.

Two engine paths, picked by the (from, to) pair:

  PyMuPDF       — image directions (PDF↔JPG/PNG). Lossless image
                  embedding, multi-output for PDF → JPG/PNG.
  LibreOffice   — office round-trips (PDF↔DOCX/XLSX/PPTX). Subprocess
                  to host `soffice --headless`. Each call gets its own
                  UserInstallation profile under /tmp/lo-* so concurrent
                  Celery tasks don't fight over the LibreOffice config
                  lockfile.

Per-pair fidelity (documented in the marketing copy):
  PDF → DOCX   lossy — paragraphs OK, layout approximate.
  PDF → XLSX   very lossy — formulas don't survive.
  PDF → PPTX   lossy — backgrounds become images.
  DOCX → PDF   high fidelity — LibreOffice is the gold standard for
               Word format on Linux.
  Image ↔ PDF  lossless.
"""
from __future__ import annotations

import contextlib
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Iterator, Literal, TypedDict

import pymupdf

ConvertFormat = Literal["PDF", "JPG", "PNG", "DOCX", "XLSX", "PPTX"]
ConvertEngine = Literal["pymupdf", "libreoffice"]

# Subset of the schema-level constant; the engine doesn't need to import
# from models.job to keep its concerns separate.
_PDF_TO_IMG: frozenset[tuple[str, str]] = frozenset({("PDF", "JPG"), ("PDF", "PNG")})
_IMG_TO_PDF: frozenset[tuple[str, str]] = frozenset({("JPG", "PDF"), ("PNG", "PDF")})
_PDF_TO_OFFICE: frozenset[tuple[str, str]] = frozenset(
    {("PDF", "DOCX"), ("PDF", "PPTX")}
)
_OFFICE_TO_PDF: frozenset[tuple[str, str]] = frozenset({("DOCX", "PDF")})

# LibreOffice CLI extension per ConvertFormat.
_LO_EXT: dict[str, str] = {
    "PDF": "pdf",
    "DOCX": "docx",
    "XLSX": "xlsx",
    "PPTX": "pptx",
}

# When the SOURCE is a PDF, LibreOffice can't auto-detect the import
# path — we have to specify which application loads it. Each target
# format needs a different importer.
_PDF_IMPORT_FILTER: dict[str, str] = {
    "DOCX": "writer_pdf_import",
    "PPTX": "impress_pdf_import",
}

# Subprocess timeout for LibreOffice. Cold-start adds ~5 s; large docs
# can take a while — 180 s is generous for normal inputs.
_LO_TIMEOUT_S = 180


class ConvertError(ValueError):
    """Raised when input is invalid, the conversion fails, or the
    output file isn't produced."""


class ConvertResult(TypedDict):
    output_paths: list[Path]
    engine: ConvertEngine
    from_format: ConvertFormat
    to_format: ConvertFormat


# Resolve `soffice` once. Tests can monkeypatch.
_SOFFICE_PATH: str | None = shutil.which("soffice") or shutil.which("libreoffice")


def _resolve_soffice_path() -> str | None:
    return _SOFFICE_PATH


def _open_pdf(path: Path) -> pymupdf.Document:
    if not path.exists():
        raise ConvertError(f"input file missing: {path.name}")
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # noqa: BLE001
        raise ConvertError(f"could not open {path.name}: {exc}") from exc
    if not doc.is_pdf:
        doc.close()
        raise ConvertError(f"{path.name} is not a PDF")
    return doc


@contextlib.contextmanager
def _libreoffice_profile() -> Iterator[Path]:
    """Per-task UserInstallation profile dir.

    LibreOffice serializes config + cache through ~/.config/libreoffice/4/.
    Two concurrent `soffice --headless` calls fight over the lockfile and
    one silently produces no output. Per-task temp dir solves it.
    """
    profile_dir = Path(tempfile.mkdtemp(prefix="lo-", dir="/tmp"))
    try:
        yield profile_dir
    finally:
        shutil.rmtree(profile_dir, ignore_errors=True)


def _run_libreoffice(
    soffice_path: str,
    input_path: Path,
    out_dir: Path,
    target_ext: str,
    *,
    infilter: str | None = None,
) -> Path:
    """Invoke LibreOffice headless and return the path to the produced
    file. Raises ConvertError on timeout, non-zero exit, or no output.

    `infilter` is required when the input is a PDF because LibreOffice
    can't auto-detect which application should load it; we tell it
    explicitly via `--infilter="writer_pdf_import"` (or the impress
    equivalent for PPTX).
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    with _libreoffice_profile() as profile_dir:
        args = [
            soffice_path,
            "--headless",
            f"-env:UserInstallation=file://{profile_dir}",
        ]
        if infilter:
            args.append(f"--infilter={infilter}")
        args += [
            "--convert-to",
            target_ext,
            "--outdir",
            str(out_dir),
            str(input_path),
        ]
        try:
            subprocess.run(
                args, timeout=_LO_TIMEOUT_S, check=True, capture_output=True
            )
        except subprocess.TimeoutExpired as exc:
            raise ConvertError(
                f"libreoffice timed out after {_LO_TIMEOUT_S}s"
            ) from exc
        except subprocess.CalledProcessError as exc:
            stderr = (exc.stderr or b"").decode("utf-8", errors="replace")[:500]
            raise ConvertError(
                f"libreoffice exited {exc.returncode}: {stderr}"
            ) from exc
        except OSError as exc:
            raise ConvertError(f"libreoffice invocation failed: {exc}") from exc

    # LibreOffice writes <out_dir>/<input_stem>.<ext>. Find by extension
    # to be paranoid about LibreOffice quirks.
    candidates = sorted(out_dir.glob(f"*.{target_ext}"))
    if not candidates:
        raise ConvertError(
            f"libreoffice produced no .{target_ext} output in {out_dir}"
        )
    return candidates[-1]


def _pdf_to_image(
    input_path: Path, out_dir: Path, *, fmt: str, dpi: int
) -> list[Path]:
    """Render every page to <out_dir>/page-NNN.<fmt>. Returns the list
    of output paths in page order."""
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = _open_pdf(input_path)
    try:
        if doc.page_count == 0:
            raise ConvertError("input PDF has no pages")
        out_paths: list[Path] = []
        for i in range(doc.page_count):
            pix = doc[i].get_pixmap(dpi=dpi)
            out = out_dir / f"page-{i + 1:03d}.{fmt.lower()}"
            pix.save(str(out))
            out_paths.append(out)
        return out_paths
    finally:
        doc.close()


def _image_to_pdf(input_path: Path, out_path: Path) -> Path:
    """Embed a single image full-bleed in a new 1-page PDF.

    Page size matches the image's pixel dimensions at 72 dpi (so a
    600×800 px image becomes a 600×800 pt PDF page) — keeps the image
    full-bleed and lossless when LibreOffice / readers downscale.
    """
    if not input_path.exists():
        raise ConvertError(f"input file missing: {input_path.name}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        pix = pymupdf.Pixmap(str(input_path))
    except Exception as exc:  # noqa: BLE001
        raise ConvertError(f"could not decode image: {exc}") from exc

    w, h = pix.width, pix.height
    if w <= 0 or h <= 0:
        raise ConvertError("image has zero dimensions")
    pix = None  # release

    out_doc = pymupdf.open()
    try:
        page = out_doc.new_page(width=w, height=h)
        page.insert_image(pymupdf.Rect(0, 0, w, h), filename=str(input_path))
        out_doc.save(str(out_path), garbage=4, deflate=True)
        return out_path
    finally:
        out_doc.close()


def convert_file(
    input_path: Path,
    out_dir: Path,
    *,
    from_format: ConvertFormat,
    to_format: ConvertFormat,
    image_dpi: int = 150,
) -> ConvertResult:
    """Top-level dispatcher. The route validates the (from, to) pair
    against ALLOWED_CONVERT_PAIRS upstream, but the engine also rejects
    unknown pairs as a defence-in-depth.
    """
    pair = (from_format, to_format)
    out_dir.mkdir(parents=True, exist_ok=True)

    if pair in _PDF_TO_IMG:
        out_paths = _pdf_to_image(
            input_path, out_dir, fmt=to_format, dpi=image_dpi
        )
        return {
            "output_paths": out_paths,
            "engine": "pymupdf",
            "from_format": from_format,
            "to_format": to_format,
        }

    if pair in _IMG_TO_PDF:
        # Single-output PDF; pick a stable filename inside out_dir.
        out_path = out_dir / "converted.pdf"
        _image_to_pdf(input_path, out_path)
        return {
            "output_paths": [out_path],
            "engine": "pymupdf",
            "from_format": from_format,
            "to_format": to_format,
        }

    if pair in _PDF_TO_OFFICE or pair in _OFFICE_TO_PDF:
        soffice = _resolve_soffice_path()
        if soffice is None:
            raise ConvertError(
                "libreoffice (soffice) is not installed — required for "
                f"{from_format}->{to_format}"
            )
        target_ext = _LO_EXT[to_format]
        # PDF → office needs an explicit import filter; office → PDF
        # auto-detects from the file extension.
        infilter = _PDF_IMPORT_FILTER.get(to_format) if from_format == "PDF" else None
        out_path = _run_libreoffice(
            soffice, input_path, out_dir, target_ext, infilter=infilter
        )
        return {
            "output_paths": [out_path],
            "engine": "libreoffice",
            "from_format": from_format,
            "to_format": to_format,
        }

    raise ConvertError(f"unsupported pair {from_format}->{to_format}")
