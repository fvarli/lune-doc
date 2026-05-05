"""Edit job end-to-end tests.

Covers the four operation types (text_overlay / highlight / redact /
shape_rect), true redaction (underlying text actually removed from
the PDF stream), and the standard Phase 1 negative cases.
"""
from __future__ import annotations

import io

import pymupdf
import pytest
from httpx import AsyncClient

from ._pdf_helpers import make_pdf


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


def _open(content: bytes) -> pymupdf.Document:
    return pymupdf.open(stream=content, filetype="pdf")


@pytest.mark.asyncio
async def test_edit_text_overlay_round_trip(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "src.pdf", page_count=2)
    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {
                    "type": "text_overlay",
                    "page": 1,
                    "x": 0.1,
                    "y": 0.1,
                    "width": 0.5,
                    "text": "Reviewed by Lunedoc",
                },
            ],
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
    doc = _open(dl.content)
    try:
        assert doc.page_count == 2
        page1_text = doc[0].get_text()
        assert "Reviewed by Lunedoc" in page1_text
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_edit_highlight_round_trip(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "src.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {
                    "type": "highlight",
                    "page": 1,
                    "x": 0.1,
                    "y": 0.2,
                    "width": 0.5,
                    "height": 0.05,
                    "color": "#ff8800",
                },
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "done"


@pytest.mark.asyncio
async def test_edit_redact_removes_underlying_text(client: AsyncClient) -> None:
    """True redaction: cover the area where 'src — page 1' is rendered
    and confirm the text is gone from the PDF stream of the output."""
    fid, token = await _upload_pdf(client, "src.pdf", page_count=2)

    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {
                    "type": "redact",
                    "page": 1,
                    "x": 0.0,
                    "y": 0.0,
                    "width": 1.0,
                    "height": 0.5,
                },
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "done", resp.json()
    job_id = resp.json()["job_id"]

    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    doc = _open(dl.content)
    try:
        assert doc.page_count == 2
        # The redacted page 1 should no longer contain the original
        # 'src — page 1' text — true redaction removes it from the stream.
        page1_text = doc[0].get_text()
        assert "src" not in page1_text, f"text NOT removed: {page1_text!r}"
        # Page 2 is untouched.
        page2_text = doc[1].get_text()
        assert "page 2" in page2_text
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_edit_shape_rect_round_trip(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "src.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {
                    "type": "shape_rect",
                    "page": 1,
                    "x": 0.4,
                    "y": 0.4,
                    "width": 0.2,
                    "height": 0.1,
                    "color": "#22cc66",
                },
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "done"


@pytest.mark.asyncio
async def test_edit_multiple_operations_in_order(client: AsyncClient) -> None:
    """Mixed operations applied in order — page count preserved, all 4
    types co-exist in one job."""
    fid, token = await _upload_pdf(client, "src.pdf", page_count=2)
    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {"type": "text_overlay", "page": 1, "x": 0.1, "y": 0.1, "width": 0.4, "text": "DRAFT"},
                {"type": "highlight",    "page": 1, "x": 0.1, "y": 0.2, "width": 0.4, "height": 0.04},
                {"type": "shape_rect",   "page": 2, "x": 0.5, "y": 0.5, "width": 0.2, "height": 0.1},
                {"type": "redact",       "page": 2, "x": 0.0, "y": 0.7, "width": 1.0, "height": 0.1},
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done", body
    job_id = body["job_id"]

    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    doc = _open(dl.content)
    try:
        assert doc.page_count == 2
        # text_overlay landed on page 1
        assert "DRAFT" in doc[0].get_text()
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_edit_wrong_owner_token(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {"type": "shape_rect", "page": 1, "x": 0.1, "y": 0.1, "width": 0.2, "height": 0.1},
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_edit_rejects_non_pdf(client: AsyncClient) -> None:
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
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {"type": "shape_rect", "page": 1, "x": 0.1, "y": 0.1, "width": 0.2, "height": 0.1},
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415


@pytest.mark.asyncio
async def test_edit_invalid_params_422(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=1)

    bad_payloads = [
        # Empty operations list
        {"file_id": fid, "operations": []},
        # Unknown type
        {"file_id": fid, "operations": [{"type": "foo", "page": 1, "x": 0.1, "y": 0.1, "width": 0.2}]},
        # Missing required field for text_overlay (text)
        {"file_id": fid, "operations": [{"type": "text_overlay", "page": 1, "x": 0.1, "y": 0.1, "width": 0.5}]},
        # Missing height for highlight
        {"file_id": fid, "operations": [{"type": "highlight", "page": 1, "x": 0.1, "y": 0.1, "width": 0.5}]},
        # x out of range
        {"file_id": fid, "operations": [{"type": "shape_rect", "page": 1, "x": 1.5, "y": 0.1, "width": 0.2, "height": 0.1}]},
        # page < 1
        {"file_id": fid, "operations": [{"type": "shape_rect", "page": 0, "x": 0.1, "y": 0.1, "width": 0.2, "height": 0.1}]},
        # width = 0
        {"file_id": fid, "operations": [{"type": "shape_rect", "page": 1, "x": 0.1, "y": 0.1, "width": 0.0, "height": 0.1}]},
    ]
    for payload in bad_payloads:
        resp = await client.post(
            "/api/v1/jobs/edit", json=payload, headers={"X-Owner-Token": token}
        )
        assert resp.status_code == 422, f"{payload} → {resp.status_code} {resp.text}"


@pytest.mark.asyncio
async def test_edit_out_of_range_page_fails_job(client: AsyncClient) -> None:
    """page=99 passes pydantic shape (>= 1) but exceeds doc page count
    → job.failed with engine error captured."""
    fid, token = await _upload_pdf(client, "p.pdf", page_count=2)
    resp = await client.post(
        "/api/v1/jobs/edit",
        json={
            "file_id": fid,
            "operations": [
                {"type": "shape_rect", "page": 99, "x": 0.1, "y": 0.1, "width": 0.2, "height": 0.1},
            ],
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "failed"
    assert body["error"] is not None
    assert "exceeds page count" in body["error"]
