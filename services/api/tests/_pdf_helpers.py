"""Tiny helpers for tests that need real PDFs."""
from __future__ import annotations

import io

import pymupdf


def make_pdf(label: str, page_count: int = 1) -> bytes:
    """Return bytes of a minimal real PDF with `page_count` pages.

    Each page just renders the label text. Using PyMuPDF guarantees the
    file is recognized by libmagic AND parseable by PyMuPDF on the way
    back through the merge engine — handcrafted PDF bytes are not
    reliably parseable by PyMuPDF (it's stricter than libmagic).
    """
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
