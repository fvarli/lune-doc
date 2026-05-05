"""Watermark job end-to-end tests.

Covers:
  - Round-trip: upload 4-page PDF, stamp "DRAFT", verify done + page
    count preserved + bytes round-trip via download.
  - Wrong owner_token on status / result → 404 (no leak).
  - Caller doesn't own the input file → 404.
  - Non-PDF input → 415.
  - Invalid params (empty text, opacity > 1, rotation out of range,
    bad position) → 422 from pydantic.
  - All 5 valid positions accepted.
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


def _page_count_of(content: bytes) -> int:
    doc = pymupdf.open(stream=content, filetype="pdf")
    try:
        return doc.page_count
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_watermark_round_trip(client: AsyncClient) -> None:
    """4-page PDF + center watermark → 4-page output downloadable."""
    fid, token = await _upload_pdf(client, "src.pdf", page_count=4)

    resp = await client.post(
        "/api/v1/jobs/watermark",
        json={
            "file_id": fid,
            "text": "DRAFT",
            "position": "center",
            "opacity": 0.3,
            "rotation": -30,
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    job_id = body["job_id"]
    assert body["status"] == "done"
    assert body["tool"] == "watermark"
    assert len(body["output_file_ids"]) == 1
    assert body["error"] is None

    # Result endpoint
    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert len(result["outputs"]) == 1
    out = result["outputs"][0]
    assert out["mime"] == "application/pdf"
    assert out["name"].startswith("watermarked-")

    # Download + verify page count preserved
    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    assert dl.status_code == 200
    assert _page_count_of(dl.content) == 4


@pytest.mark.asyncio
async def test_watermark_wrong_owner_token(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=2)

    resp = await client.post(
        "/api/v1/jobs/watermark",
        json={"file_id": fid, "text": "X"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404, f"{path} → {resp.status_code}"


@pytest.mark.asyncio
async def test_watermark_rejects_unowned_input(client: AsyncClient) -> None:
    _fid_a, token_a = await _upload_pdf(client, "a.pdf", page_count=2)
    fid_b, _token_b = await _upload_pdf(client, "b.pdf", page_count=2)

    resp = await client.post(
        "/api/v1/jobs/watermark",
        json={"file_id": fid_b, "text": "X"},
        headers={"X-Owner-Token": token_a},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_watermark_rejects_non_pdf(client: AsyncClient) -> None:
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
        "/api/v1/jobs/watermark",
        json={"file_id": fid, "text": "X"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415
    assert "not a PDF" in resp.text


@pytest.mark.asyncio
async def test_watermark_invalid_params_422(client: AsyncClient) -> None:
    fid, token = await _upload_pdf(client, "p.pdf", page_count=2)

    bad_payloads = [
        # Empty text
        {"file_id": fid, "text": ""},
        # Opacity > 1
        {"file_id": fid, "text": "X", "opacity": 1.5},
        # Opacity < 0.1
        {"file_id": fid, "text": "X", "opacity": 0.05},
        # Rotation out of range
        {"file_id": fid, "text": "X", "rotation": 200},
        # Unknown position
        {"file_id": fid, "text": "X", "position": "diagonal"},
    ]
    for payload in bad_payloads:
        resp = await client.post(
            "/api/v1/jobs/watermark", json=payload, headers={"X-Owner-Token": token}
        )
        assert resp.status_code == 422, f"{payload} → {resp.status_code} {resp.text}"


@pytest.mark.asyncio
async def test_watermark_all_positions_accepted(client: AsyncClient) -> None:
    """Each of the 5 valid positions runs to done."""
    for position in ("center", "top-left", "top-right", "bottom-left", "bottom-right"):
        fid, token = await _upload_pdf(client, "p.pdf", page_count=1)
        resp = await client.post(
            "/api/v1/jobs/watermark",
            json={"file_id": fid, "text": "X", "position": position},
            headers={"X-Owner-Token": token},
        )
        assert resp.status_code == 202, f"{position}: {resp.text}"
        assert resp.json()["status"] == "done", f"{position}: {resp.json()}"
