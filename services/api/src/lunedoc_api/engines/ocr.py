"""Optical Character Recognition via Tesseract.

Engine path: PyMuPDF renders each page to a bitmap → Pillow Image →
pytesseract subprocess to host `tesseract`. Two output modes:

  extract     plain .txt of recognized text, one form-feed between pages
  searchable  PDF with the original raster + an invisible OCR text
              layer (Ctrl+F works in any reader)

No native Python fallback — Tesseract is the engine. The README + the
project-status doc both list `tesseract-ocr` and the language packs
as hard prerequisites.
"""
from __future__ import annotations

import io
import logging
import shutil
import subprocess
from pathlib import Path
from typing import Literal, TypedDict

import pymupdf
import pytesseract
from PIL import Image

OcrMode = Literal["extract", "searchable"]
OcrLang = Literal["eng", "tur", "spa"]
OcrEngine = Literal["tesseract"]

log = logging.getLogger(__name__)


class OcrError(ValueError):
    """Raised when Tesseract / language pack is missing, the input is
    not a PDF, or the subprocess fails."""


class OcrResult(TypedDict):
    output_path: Path
    engine: OcrEngine
    mode: OcrMode
    lang: OcrLang
    page_count: int


# Resolved at module load. Tests can monkeypatch both attributes to
# simulate "Tesseract not installed".
_TESSERACT_PATH: str | None = shutil.which("tesseract")


def _detect_languages() -> frozenset[str]:
    """Run `tesseract --list-langs` once and return the available langs."""
    if _TESSERACT_PATH is None:
        return frozenset()
    try:
        result = subprocess.run(
            [_TESSERACT_PATH, "--list-langs"],
            timeout=10,
            check=False,
            capture_output=True,
        )
    except (subprocess.TimeoutExpired, OSError):
        return frozenset()
    # First line is a header ("List of available languages..."); the rest
    # is one lang code per line.
    lines = result.stdout.decode("utf-8", errors="replace").splitlines()
    return frozenset(line.strip() for line in lines[1:] if line.strip())


_AVAILABLE_LANGS: frozenset[str] = _detect_languages()


def _open_pdf(path: Path) -> pymupdf.Document:
    if not path.exists():
        raise OcrError(f"input file missing: {path.name}")
    try:
        doc = pymupdf.open(path)
    except Exception as exc:  # noqa: BLE001
        raise OcrError(f"could not open {path.name}: {exc}") from exc
    if not doc.is_pdf:
        doc.close()
        raise OcrError(f"{path.name} is not a PDF")
    return doc


def _render_page(page: pymupdf.Page, dpi: int) -> Image.Image:
    pix = page.get_pixmap(dpi=dpi)
    img_bytes = pix.tobytes("png")
    return Image.open(io.BytesIO(img_bytes))


def ocr_pdf(
    input_path: Path,
    out_dir: Path,
    *,
    mode: OcrMode,
    lang: OcrLang,
    dpi: int = 200,
) -> OcrResult:
    """Run OCR on every page of `input_path`. Returns the engine output
    path + metadata.

    Raises:
        OcrError: when Tesseract isn't installed, the language pack
                  isn't installed, the input isn't a PDF, or any
                  Tesseract subprocess fails.
    """
    if _TESSERACT_PATH is None:
        raise OcrError(
            "tesseract is not installed — required for OCR jobs. "
            "Install it with `apt install tesseract-ocr "
            "tesseract-ocr-eng tesseract-ocr-tur tesseract-ocr-spa`."
        )
    if lang not in _AVAILABLE_LANGS:
        raise OcrError(
            f"language pack {lang!r} not installed (available: "
            f"{sorted(_AVAILABLE_LANGS)})"
        )
    if mode not in ("extract", "searchable"):
        raise OcrError(f"unknown ocr mode: {mode!r}")

    out_dir.mkdir(parents=True, exist_ok=True)

    doc = _open_pdf(input_path)
    try:
        page_count = doc.page_count
        if page_count == 0:
            raise OcrError("input PDF has no pages")

        if mode == "extract":
            buf: list[str] = []
            for i in range(page_count):
                image = _render_page(doc[i], dpi)
                try:
                    page_text = pytesseract.image_to_string(image, lang=lang)
                except pytesseract.TesseractError as exc:
                    raise OcrError(
                        f"tesseract extract failed on page {i + 1}: {exc}"
                    ) from exc
                buf.append(page_text)
            text = "\f".join(buf)
            out_path = out_dir / "extracted.txt"
            out_path.write_text(text, encoding="utf-8")
            log.info(
                "ocr: extracted %d chars from %d pages (lang=%s)",
                len(text),
                page_count,
                lang,
            )
            return {
                "output_path": out_path,
                "engine": "tesseract",
                "mode": mode,
                "lang": lang,
                "page_count": page_count,
            }

        # searchable
        out_doc = pymupdf.open()
        try:
            for i in range(page_count):
                image = _render_page(doc[i], dpi)
                try:
                    page_pdf_bytes = pytesseract.image_to_pdf_or_hocr(
                        image, lang=lang, extension="pdf"
                    )
                except pytesseract.TesseractError as exc:
                    raise OcrError(
                        f"tesseract searchable failed on page {i + 1}: {exc}"
                    ) from exc
                page_doc = pymupdf.open(stream=page_pdf_bytes, filetype="pdf")
                try:
                    out_doc.insert_pdf(page_doc)
                finally:
                    page_doc.close()
            out_path = out_dir / "searchable.pdf"
            out_doc.save(str(out_path), garbage=4, deflate=True)
            log.info(
                "ocr: built searchable PDF with %d pages (lang=%s)",
                page_count,
                lang,
            )
            return {
                "output_path": out_path,
                "engine": "tesseract",
                "mode": mode,
                "lang": lang,
                "page_count": page_count,
            }
        finally:
            out_doc.close()
    finally:
        doc.close()
