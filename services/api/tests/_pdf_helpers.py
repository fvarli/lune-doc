"""Tiny helpers for tests that need real fixtures.

Everything generated programmatically — no binary fixtures committed
to the repo. Office formats use LibreOffice itself to produce a
tiny .docx / .xlsx / .pptx, with the result cached on disk so the
~5s LibreOffice cold-start cost is paid once per test session.
"""
from __future__ import annotations

import io
import shutil
import subprocess
import tempfile
from pathlib import Path

import pymupdf

_FIXTURE_CACHE = Path(__file__).parent / "_fixture_cache"


def make_pdf(label: str, page_count: int = 1) -> bytes:
    """Return bytes of a minimal real PDF with `page_count` pages."""
    doc = pymupdf.open()
    try:
        for i in range(page_count):
            page = doc.new_page(width=300, height=200)
            page.insert_text((20, 50), f"{label} — page {i + 1}", fontsize=14)
        buf = io.BytesIO()
        doc.save(buf, garbage=4, deflate=True)
        return buf.getvalue()
    finally:
        doc.close()


def make_png(width: int = 4, height: int = 2, rgb: tuple[int, int, int] = (200, 0, 0)) -> bytes:
    """Real PNG via PyMuPDF (guaranteed to pass any decoder)."""
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, width, height))
    for x in range(width):
        for y in range(height):
            pix.set_pixel(x, y, rgb)
    return pix.tobytes("png")


def make_jpg(width: int = 4, height: int = 2, rgb: tuple[int, int, int] = (200, 0, 0)) -> bytes:
    """Real JPEG via PyMuPDF."""
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, width, height))
    for x in range(width):
        for y in range(height):
            pix.set_pixel(x, y, rgb)
    return pix.tobytes("jpeg")


def _make_office_via_libreoffice(target_ext: str, seed_text: str) -> bytes:
    """Generate a tiny .docx / .xlsx / .pptx by converting a text
    seed through LibreOffice. Caches the produced bytes under
    tests/_fixture_cache/ so the cold-start cost is paid once."""
    cache_path = _FIXTURE_CACHE / f"tiny.{target_ext}"
    if cache_path.exists():
        return cache_path.read_bytes()

    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if soffice is None:
        raise RuntimeError(
            "libreoffice (soffice) not installed — required to generate "
            f"the .{target_ext} fixture"
        )

    _FIXTURE_CACHE.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="lo-fixture-", dir="/tmp"))
    profile = Path(tempfile.mkdtemp(prefix="lo-profile-", dir="/tmp"))
    try:
        seed = work / "seed.txt"
        seed.write_text(seed_text, encoding="utf-8")
        subprocess.run(
            [
                soffice,
                "--headless",
                f"-env:UserInstallation=file://{profile}",
                "--convert-to",
                target_ext,
                "--outdir",
                str(work),
                str(seed),
            ],
            timeout=180,
            check=True,
            capture_output=True,
        )
        out = work / f"seed.{target_ext}"
        if not out.exists():
            raise RuntimeError(
                f"libreoffice produced no .{target_ext} output in {work}"
            )
        data = out.read_bytes()
        cache_path.write_bytes(data)
        return data
    finally:
        shutil.rmtree(work, ignore_errors=True)
        shutil.rmtree(profile, ignore_errors=True)


def make_docx(text: str = "Hello Lunedoc Convert.") -> bytes:
    return _make_office_via_libreoffice("docx", text)


def make_xlsx(text: str = "Lunedoc,Convert\n1,2") -> bytes:
    # Raw text → .xlsx renders as a single cell. Good enough for
    # round-trip fixtures.
    return _make_office_via_libreoffice("xlsx", text)


def make_pptx(text: str = "Lunedoc Convert") -> bytes:
    return _make_office_via_libreoffice("pptx", text)
