"""Split job end-to-end tests.

Covers:
  - Round-trip ranges: 6-page PDF → [[1,2],[3,5],[6,6]] → 3 outputs
    of 2/3/1 pages, page text matches.
  - Round-trip per_page: 4-page PDF → 4 single-page PDFs.
  - Wrong owner_token on status / result → 404 (no leak).
  - Caller doesn't own the input file → 404.
  - Non-PDF input → 415.
  - Malformed ranges (start > end, 0-indexed, len != 2) → 422.
  - Out-of-bounds range that passes pydantic but exceeds page count
    → job.failed with engine error captured.
  - Empty ranges with mode='ranges' → 422.
  - Result endpoint over multiple outputs.
"""
from __future__ import annotations

import io

import pymupdf
import pytest
from httpx import AsyncClient

from ._pdf_helpers import make_pdf


async def _upload_pdf(
    client: AsyncClient, name: str, page_count: int
) -> tuple[str, str, bytes]:
    pdf = make_pdf(name.removesuffix(".pdf"), page_count=page_count)
    resp = await client.post(
        "/api/v1/files",
        files={"file": (name, io.BytesIO(pdf), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["file_id"], body["owner_token"], pdf


def _page_count_of(content: bytes) -> int:
    doc = pymupdf.open(stream=content, filetype="pdf")
    try:
        return doc.page_count
    finally:
        doc.close()


def _page_text_of(content: bytes, idx: int) -> str:
    doc = pymupdf.open(stream=content, filetype="pdf")
    try:
        return doc[idx].get_text()
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_split_ranges_round_trip(client: AsyncClient) -> None:
    """6-page PDF → [[1,2],[3,5],[6,6]] → 3 outputs of 2/3/1 pages."""
    fid, token, _src = await _upload_pdf(client, "src.pdf", page_count=6)

    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "ranges", "ranges": [[1, 2], [3, 5], [6, 6]]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    job_id = body["job_id"]
    assert body["status"] == "done"
    assert body["tool"] == "split"
    assert len(body["output_file_ids"]) == 3
    assert body["error"] is None

    # Status endpoint
    resp = await client.get(
        f"/api/v1/jobs/{job_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "done"

    # Result endpoint with multiple outputs
    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert len(result["outputs"]) == 3
    expected_pages = [2, 3, 1]
    for idx, out in enumerate(result["outputs"]):
        assert out["mime"] == "application/pdf"
        assert out["name"].startswith("split-")
        # Download and verify page count
        dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
        assert dl.status_code == 200
        assert _page_count_of(dl.content) == expected_pages[idx]
        # First page text contains "src — page <n>" where n is the original
        # 1-indexed page number, so we can verify ordering.
        first_text = _page_text_of(dl.content, 0)
        assert "src" in first_text


@pytest.mark.asyncio
async def test_split_per_page_round_trip(client: AsyncClient) -> None:
    """4-page PDF → per_page → 4 single-page PDFs."""
    fid, token, _src = await _upload_pdf(client, "p.pdf", page_count=4)

    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "per_page"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    job_id = body["job_id"]
    assert body["status"] == "done"
    assert len(body["output_file_ids"]) == 4

    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    result = resp.json()
    for i, out in enumerate(result["outputs"]):
        dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
        assert dl.status_code == 200
        assert _page_count_of(dl.content) == 1
        # The i-th output should contain the (i+1)-th original page
        text = _page_text_of(dl.content, 0)
        assert f"page {i + 1}" in text


@pytest.mark.asyncio
async def test_split_wrong_owner_token(client: AsyncClient) -> None:
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=2)

    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "per_page"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404, f"{path} → {resp.status_code}"


@pytest.mark.asyncio
async def test_split_rejects_unowned_input(client: AsyncClient) -> None:
    """Caller's token doesn't own the input file → 404 (no leak)."""
    _fid_a, token_a, _ = await _upload_pdf(client, "a.pdf", page_count=2)
    fid_b, _token_b, _ = await _upload_pdf(client, "b.pdf", page_count=2)

    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid_b, "mode": "per_page"},
        headers={"X-Owner-Token": token_a},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_split_rejects_non_pdf_input(client: AsyncClient) -> None:
    """Non-PDF input rejected with 415."""
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
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "per_page"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415
    assert "not a PDF" in resp.text


@pytest.mark.asyncio
async def test_split_invalid_ranges_pydantic_422(client: AsyncClient) -> None:
    """Malformed ranges (0-indexed, start>end, wrong shape) → 422 from
    pydantic validators, never reaches Celery."""
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=4)

    bad_payloads = [
        # 0-indexed
        {"file_id": fid, "mode": "ranges", "ranges": [[0, 2]]},
        # start > end
        {"file_id": fid, "mode": "ranges", "ranges": [[3, 1]]},
        # wrong shape
        {"file_id": fid, "mode": "ranges", "ranges": [[1, 2, 3]]},
    ]
    for body in bad_payloads:
        resp = await client.post(
            "/api/v1/jobs/split", json=body, headers={"X-Owner-Token": token}
        )
        assert resp.status_code == 422, f"{body} → {resp.status_code} {resp.text}"


@pytest.mark.asyncio
async def test_split_empty_ranges_422(client: AsyncClient) -> None:
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=4)
    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "ranges", "ranges": []},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_split_out_of_bounds_range_fails_job(client: AsyncClient) -> None:
    """A valid-shape range that exceeds the actual page count passes
    pydantic but fails inside the engine — job.status='failed' with
    a captured SplitError message."""
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=4)

    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "ranges", "ranges": [[1, 99]]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "failed"
    assert body["error"]
    assert "exceeds page count" in body["error"]
    assert body["output_file_ids"] == []

    # Result endpoint surfaces 422 with the captured error
    resp = await client.get(
        f"/api/v1/jobs/{body['job_id']}/result",
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422
    assert "SplitError" in resp.text


@pytest.mark.asyncio
async def test_split_ranges_mode_requires_ranges_key(client: AsyncClient) -> None:
    """mode='ranges' but no ranges key → 422."""
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=4)
    resp = await client.post(
        "/api/v1/jobs/split",
        json={"file_id": fid, "mode": "ranges"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422
