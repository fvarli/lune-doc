"""OCR job end-to-end tests.

Module-level dependency gate (per the user's instruction): if
Tesseract or any of the eng / tur / spa language packs are missing,
the whole module raises at import time with a clear message. We do
NOT silently skip — a missing OCR dep is a project-config issue we
want to surface loudly.

The synthesized PDFs use PyMuPDF to render text at a known font size
and color so Tesseract can recognize it reliably at the engine's
default 200 dpi.
"""
from __future__ import annotations

import io
import shutil

import pymupdf
import pytest
from httpx import AsyncClient

from lunedoc_api.engines import ocr as ocr_engine
from lunedoc_api.models.job import OCR_FREE_PAGE_CAP


# ---- module-level dependency gate ----------------------------------

_TESSERACT_PATH = shutil.which("tesseract")
if _TESSERACT_PATH is None:
    raise RuntimeError(
        "tesseract is not installed — required to run the OCR test "
        "suite. Install with `apt install tesseract-ocr "
        "tesseract-ocr-eng tesseract-ocr-tur tesseract-ocr-spa`."
    )

_REQUIRED_LANGS = {"eng", "tur", "spa"}
_MISSING = _REQUIRED_LANGS - ocr_engine._AVAILABLE_LANGS
if _MISSING:
    raise RuntimeError(
        f"OCR language pack(s) not installed: {sorted(_MISSING)}. "
        f"Install with `apt install "
        f"{' '.join(f'tesseract-ocr-{p}' for p in sorted(_MISSING))}`."
    )


# ---- helpers --------------------------------------------------------


def make_ocr_pdf(text: str, page_count: int = 1) -> bytes:
    """A PDF with `text` rendered at large size + good contrast on each
    page — built to be reliably recognized by Tesseract at 200 dpi."""
    doc = pymupdf.open()
    try:
        for i in range(page_count):
            page = doc.new_page(width=420, height=300)
            # Large, dark, monospace-ish text; no anti-alias quirks.
            page.insert_text(
                (40, 80),
                text,
                fontsize=28,
                fontname="hebo",
                color=(0, 0, 0),
            )
            page.insert_text(
                (40, 130),
                f"page {i + 1}",
                fontsize=20,
                fontname="hebo",
                color=(0, 0, 0),
            )
        buf = io.BytesIO()
        doc.save(buf, garbage=4, deflate=True)
        return buf.getvalue()
    finally:
        doc.close()


async def _upload_pdf(
    client: AsyncClient, name: str, page_count: int, text: str = "Hello Lunedoc OCR"
) -> tuple[str, str]:
    pdf = make_ocr_pdf(text, page_count=page_count)
    resp = await client.post(
        "/api/v1/files",
        files={"file": (name, io.BytesIO(pdf), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["file_id"], body["owner_token"]


# ---- happy paths ----------------------------------------------------


@pytest.mark.asyncio
async def test_ocr_extract_eng_round_trip(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "src.pdf", page_count=1, text="Hello Lunedoc")
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "done", body

    resp = await client.get(
        f"/api/v1/jobs/{body['job_id']}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    assert out["mime"] == "text/plain"
    assert out["name"].startswith("extracted-")

    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    assert dl.status_code == 200
    text = dl.content.decode("utf-8")
    # Tesseract is tolerant on this clean input — expect "Hello" + "Lunedoc"
    # both recognized; allow some flexibility on case / spacing.
    lower = text.lower()
    assert "hello" in lower
    assert "lunedoc" in lower


@pytest.mark.asyncio
async def test_ocr_searchable_eng_round_trip(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "src.pdf", page_count=2, text="Searchable Test")
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "searchable", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done", body

    resp = await client.get(
        f"/api/v1/jobs/{body['job_id']}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    assert out["mime"] == "application/pdf"
    assert out["name"].startswith("ocr-")

    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    doc = pymupdf.open(stream=dl.content, filetype="pdf")
    try:
        assert doc.page_count == 2
        # OCR layer text should be present + selectable on at least page 1.
        page_text = doc[0].get_text().lower()
        assert "searchable" in page_text or "test" in page_text
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_ocr_extract_tur(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(
        client, "src.pdf", page_count=1, text="Merhaba Lunedoc"
    )
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "tur"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done", body


@pytest.mark.asyncio
async def test_ocr_extract_spa(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(
        client, "src.pdf", page_count=1, text="Hola Lunedoc"
    )
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "spa"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done", body


# ---- negative cases -------------------------------------------------


@pytest.mark.asyncio
async def test_ocr_wrong_owner_token(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_ocr_rejects_non_pdf(client: AsyncClient) -> None:
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfa\xff"
        b"\xff?\x03\x00\x05\xfe\x02\xfe\xa7VG\xd1\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    resp = await client.post(
        "/api/v1/files",
        files={"file": ("img.png", io.BytesIO(png_bytes), "application/octet-stream")},
    )
    assert resp.status_code == 201
    fid = resp.json()["file_id"]
    token = resp.json()["owner_token"]

    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415


@pytest.mark.asyncio
async def test_ocr_invalid_mode_422(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "hocr", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_ocr_invalid_lang_422(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "deu"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_ocr_page_cap_boundary(client: AsyncClient) -> None:
    """20-page PDF accepted (= cap); 21-page PDF rejected with cap msg."""
    # 20 pages — exactly at cap, should be accepted.
    fid20, token20 = await _upload_pdf(
        client, "twenty.pdf", page_count=OCR_FREE_PAGE_CAP, text="X"
    )
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid20, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token20},
    )
    # 20 pages will run real Tesseract on each; expect 202 + done.
    assert resp.status_code == 202, resp.text

    # 21 pages — over cap, should be rejected at the route layer.
    fid21, token21 = await _upload_pdf(
        client, "twentyone.pdf", page_count=OCR_FREE_PAGE_CAP + 1, text="X"
    )
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid21, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token21},
    )
    assert resp.status_code == 422
    assert "capped at" in resp.text and str(OCR_FREE_PAGE_CAP) in resp.text


@pytest.mark.asyncio
async def test_ocr_tesseract_missing_fails_job(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Simulate a host without Tesseract: monkeypatch _TESSERACT_PATH +
    _AVAILABLE_LANGS to empty. The engine should raise OcrError; the
    job ends `failed` with a clear message."""
    monkeypatch.setattr(ocr_engine, "_TESSERACT_PATH", None)
    monkeypatch.setattr(ocr_engine, "_AVAILABLE_LANGS", frozenset())

    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    # The route doesn't probe Tesseract; the page-cap check passes (1
    # page <= 20). The job dispatches and the engine raises OcrError.
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "failed"
    assert body["error"] is not None
    assert "tesseract is not installed" in body["error"].lower()


@pytest.mark.asyncio
async def test_ocr_extract_output_mime_text_plain(client: AsyncClient) -> None:
    """Verify the .txt File row's stored mime is text/plain even though
    that mime isn't on the upload whitelist."""
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done"
    out_id = body["output_file_ids"][0]

    resp = await client.get(
        f"/api/v1/files/{out_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200
    assert resp.json()["mime"] == "text/plain"
