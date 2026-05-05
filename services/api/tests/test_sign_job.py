"""Sign job end-to-end tests.

Covers:
  - Text signature: 4-page PDF, stamp "Jane Doe" on page 2 → done,
    page count preserved, text appears on the right page only.
  - Image signature: 4-page PDF, stamp a 1×1 PNG on page 1 → done,
    page count preserved.
  - Wrong owner_token on status / result → 404.
  - Caller doesn't own input → 404.
  - Non-PDF input → 415.
  - Invalid pydantic shape (missing text in text mode, missing
    image_data in image mode, page=0, x>1, etc.) → 422.
  - Out-of-range page (passes shape but exceeds doc page count) →
    job.failed with engine error captured.
"""
from __future__ import annotations

import base64
import io

import pymupdf
import pytest
from httpx import AsyncClient

from ._pdf_helpers import make_pdf


def _make_png(width: int = 4, height: int = 2, rgb: tuple[int, int, int] = (200, 0, 0)) -> bytes:
    """Generate a real PNG via PyMuPDF — guaranteed to pass any PNG decoder."""
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, width, height))
    for x in range(width):
        for y in range(height):
            pix.set_pixel(x, y, rgb)
    return pix.tobytes("png")


TINY_PNG_BYTES = _make_png()
TINY_PNG_B64 = base64.b64encode(TINY_PNG_BYTES).decode("ascii")


async def _upload_pdf(
    client: AsyncClient, name: str, page_count: int
) -> tuple[str, str]:
    pdf = make_pdf(name.removesuffix(".pdf"), page_count=page_count)
    resp = await client.post(
        "/api/v1/files",
        files={"file": (name, io.BytesIO(pdf), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["file_id"], body["owner_token"]


def _page_count_of(content: bytes) -> int:
    doc = pymupdf.open(stream=content, filetype="pdf")
    try:
        return doc.page_count
    finally:
        doc.close()


def _page_text(content: bytes, page_idx: int) -> str:
    doc = pymupdf.open(stream=content, filetype="pdf")
    try:
        return doc[page_idx].get_text()
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_sign_text_mode_round_trip(client: AsyncClient) -> None:
    """Stamp 'Jane Doe' on page 2 of a 4-page doc. Output retains 4
    pages; the new text appears on page 2 (1-indexed)."""
    fid, token = await _upload_pdf(client, "src.pdf", page_count=4)

    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid,
            "mode": "text",
            "page": 2,
            "x": 0.1,
            "y": 0.65,
            "width": 0.3,
            "text": "Jane Doe",
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "done", body
    assert body["tool"] == "sign"
    assert len(body["output_file_ids"]) == 1

    resp = await client.get(
        f"/api/v1/jobs/{body['job_id']}/result",
        headers={"X-Owner-Token": token},
    )
    out = resp.json()["outputs"][0]

    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    assert dl.status_code == 200
    assert _page_count_of(dl.content) == 4
    # Stamped text should be visible on page 2 (idx 1)
    assert "Jane Doe" in _page_text(dl.content, 1)


@pytest.mark.asyncio
async def test_sign_image_mode_round_trip(client: AsyncClient) -> None:
    """Stamp a tiny PNG on page 1 of a 2-page doc. Output retains 2
    pages."""
    fid, token = await _upload_pdf(client, "p.pdf", page_count=2)

    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid,
            "mode": "image",
            "page": 1,
            "x": 0.5,
            "y": 0.5,
            "width": 0.2,
            "image_data": f"data:image/png;base64,{TINY_PNG_B64}",
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "done", body
    job_id = body["job_id"]

    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]

    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    assert dl.status_code == 200
    assert _page_count_of(dl.content) == 2


@pytest.mark.asyncio
async def test_sign_wrong_owner_token(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid,
            "mode": "text",
            "page": 1,
            "x": 0.1,
            "y": 0.5,
            "width": 0.3,
            "text": "X",
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404, f"{path} → {resp.status_code}"


@pytest.mark.asyncio
async def test_sign_rejects_unowned_input(client: AsyncClient) -> None:
    _fid_a, token_a = await _upload_pdf(client, "a.pdf", page_count=1)
    fid_b, _token_b = await _upload_pdf(client, "b.pdf", page_count=1)

    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid_b,
            "mode": "text",
            "page": 1,
            "x": 0.1,
            "y": 0.5,
            "width": 0.3,
            "text": "X",
        },
        headers={"X-Owner-Token": token_a},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sign_rejects_non_pdf(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/files",
        files={"file": ("img.png", io.BytesIO(TINY_PNG_BYTES), "application/octet-stream")},
    )
    assert resp.status_code == 201
    fid = resp.json()["file_id"]
    token = resp.json()["owner_token"]

    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid,
            "mode": "text",
            "page": 1,
            "x": 0.1,
            "y": 0.5,
            "width": 0.3,
            "text": "X",
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415
    assert "not a PDF" in resp.text


@pytest.mark.asyncio
async def test_sign_invalid_params_422(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=2)

    bad_payloads = [
        # text mode without text
        {"file_id": fid, "mode": "text", "page": 1, "x": 0.1, "y": 0.1, "width": 0.3},
        # image mode without image_data
        {"file_id": fid, "mode": "image", "page": 1, "x": 0.1, "y": 0.1, "width": 0.3},
        # text mode with image_data (mutually exclusive)
        {
            "file_id": fid, "mode": "text", "page": 1, "x": 0.1, "y": 0.1,
            "width": 0.3, "text": "X", "image_data": TINY_PNG_B64,
        },
        # page = 0 (must be >= 1)
        {"file_id": fid, "mode": "text", "page": 0, "x": 0.1, "y": 0.1, "width": 0.3, "text": "X"},
        # x out of range
        {"file_id": fid, "mode": "text", "page": 1, "x": 1.5, "y": 0.1, "width": 0.3, "text": "X"},
        # width = 0 (must be > 0)
        {"file_id": fid, "mode": "text", "page": 1, "x": 0.1, "y": 0.1, "width": 0.0, "text": "X"},
    ]
    for payload in bad_payloads:
        resp = await client.post(
            "/api/v1/jobs/sign", json=payload, headers={"X-Owner-Token": token}
        )
        assert resp.status_code == 422, f"{payload} → {resp.status_code} {resp.text}"


@pytest.mark.asyncio
async def test_sign_out_of_range_page_fails_job(client: AsyncClient) -> None:
    """page=99 passes pydantic shape (>= 1) but exceeds the doc's
    actual page count → job.failed with captured SignError."""
    fid, token = await _upload_pdf(client, "p.pdf", page_count=2)
    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid, "mode": "text", "page": 99, "x": 0.1, "y": 0.5,
            "width": 0.3, "text": "X",
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "failed"
    assert body["error"] is not None
    assert "out of range" in body["error"]


@pytest.mark.asyncio
async def test_sign_invalid_image_data_fails_job(client: AsyncClient) -> None:
    """Garbage image_data passes the pydantic max_length check but
    fails inside the engine's PNG/JPEG validation → job.failed."""
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/sign",
        json={
            "file_id": fid,
            "mode": "image",
            "page": 1,
            "x": 0.1,
            "y": 0.1,
            "width": 0.2,
            "image_data": base64.b64encode(b"NOT AN IMAGE").decode("ascii"),
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "failed"
    assert body["error"] is not None
    assert "magic bytes" in body["error"] or "not a PNG" in body["error"]
