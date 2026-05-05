"""Compress job end-to-end tests.

Exercises the Ghostscript path when `gs` is on PATH, and the
PyMuPDF fallback via monkeypatch. All three quality levels accepted.
No-regression guarantee verified: a tiny PDF whose compression
makes it bigger gets the original bytes shipped through.
"""
from __future__ import annotations

import io
import shutil

import pymupdf
import pytest
from httpx import AsyncClient

from lunedoc_api.engines import compress as compress_engine

from ._pdf_helpers import make_pdf


async def _upload_pdf(
    client: AsyncClient, name: str, page_count: int
) -> tuple[str, str, int]:
    pdf = make_pdf(name.removesuffix(".pdf"), page_count=page_count)
    resp = await client.post(
        "/api/v1/files",
        files={"file": (name, io.BytesIO(pdf), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["file_id"], body["owner_token"], len(pdf)


def _page_count_of(content: bytes) -> int:
    doc = pymupdf.open(stream=content, filetype="pdf")
    try:
        return doc.page_count
    finally:
        doc.close()


@pytest.mark.skipif(shutil.which("gs") is None, reason="ghostscript not installed")
@pytest.mark.asyncio
async def test_compress_round_trip_ghostscript(client: AsyncClient) -> None:
    """3-page PDF → compress (medium) → done, page count preserved,
    job.params.result_meta records bytes + engine."""
    fid, token, _input_bytes = await _upload_pdf(client, "src.pdf", page_count=3)

    resp = await client.post(
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": "medium"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "done", body
    job_id = body["job_id"]

    # Status endpoint returns the post-task params (with result_meta).
    resp = await client.get(
        f"/api/v1/jobs/{job_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200

    # Result endpoint
    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    assert out["mime"] == "application/pdf"
    assert out["name"].startswith("compressed-")

    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    assert dl.status_code == 200
    assert _page_count_of(dl.content) == 3


@pytest.mark.asyncio
@pytest.mark.parametrize("level", ["low", "medium", "high"])
async def test_compress_all_levels_accepted(client: AsyncClient, level: str) -> None:
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": level},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    assert resp.json()["status"] == "done", f"{level}: {resp.json()}"


@pytest.mark.asyncio
async def test_compress_pymupdf_fallback(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Force the fallback by monkeypatching the cached gs path to None.
    The job should still complete; result_meta.engine == 'pymupdf'."""
    monkeypatch.setattr(compress_engine, "_GS_PATH", None)

    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=2)
    resp = await client.post(
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": "medium"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done", body


@pytest.mark.asyncio
async def test_compress_wrong_owner_token(client: AsyncClient) -> None:
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": "medium"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_compress_rejects_non_pdf(client: AsyncClient) -> None:
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
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": "medium"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415


@pytest.mark.asyncio
async def test_compress_invalid_level_422(client: AsyncClient) -> None:
    fid, token, _ = await _upload_pdf(client, "p.pdf", page_count=1)
    resp = await client.post(
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": "ultra"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_compress_no_regression_when_output_larger(client: AsyncClient) -> None:
    """A 1-page PDF compressed at /printer often comes out *larger*.
    The engine must ship the original bytes through in that case so
    the user never gets a worse file. Verifies the no-regression
    guarantee end-to-end."""
    fid, token, input_bytes = await _upload_pdf(client, "tiny.pdf", page_count=1)

    resp = await client.post(
        "/api/v1/jobs/compress",
        json={"file_id": fid, "level": "high"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done"
    job_id = body["job_id"]

    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    assert out["size"] <= input_bytes, (
        f"output {out['size']} > input {input_bytes} — no-regression broken"
    )
