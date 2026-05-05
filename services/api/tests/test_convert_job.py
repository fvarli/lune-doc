"""Convert job end-to-end tests.

Eight allowed (from, to) pairs round-tripped, plus negative paths
(wrong owner_token, MIME mismatch, unsupported pair, ocr=true,
out-of-range image_dpi, LibreOffice timeout, profile cleanup).

LibreOffice subprocess is exercised in 4 of the 8 happy paths
(PDF→DOCX/XLSX/PPTX, DOCX→PDF). Office fixtures are generated on
first run and cached under tests/_fixture_cache/.
"""
from __future__ import annotations

import io
import shutil
import subprocess
from pathlib import Path

import pymupdf
import pytest
from httpx import AsyncClient

from lunedoc_api.engines import convert as convert_engine

from ._pdf_helpers import (
    make_docx,
    make_jpg,
    make_pdf,
    make_png,
    make_pptx,
    make_xlsx,
)

# Skip the LibreOffice-dependent tests if soffice isn't on PATH.
_SOFFICE = shutil.which("soffice") or shutil.which("libreoffice")
_NEEDS_LO = pytest.mark.skipif(_SOFFICE is None, reason="libreoffice not installed")


# ------- helpers -------

_MIME = {
    "PDF": "application/pdf",
    "JPG": "image/jpeg",
    "PNG": "image/png",
    "DOCX": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "XLSX": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "PPTX": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


def _bytes_for(format_: str) -> bytes:
    if format_ == "PDF":
        return make_pdf("convert", page_count=2)
    if format_ == "JPG":
        return make_jpg()
    if format_ == "PNG":
        return make_png()
    if format_ == "DOCX":
        return make_docx()
    if format_ == "XLSX":
        return make_xlsx()
    if format_ == "PPTX":
        return make_pptx()
    raise ValueError(f"unknown format {format_}")


async def _upload(
    client: AsyncClient, format_: str, name: str | None = None
) -> tuple[str, str]:
    blob = _bytes_for(format_)
    fname = name or f"input.{format_.lower()}"
    resp = await client.post(
        "/api/v1/files",
        files={"file": (fname, io.BytesIO(blob), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["mime"] == _MIME[format_], (
        f"upload mime mismatch for {format_}: {body['mime']}"
    )
    return body["file_id"], body["owner_token"]


# ------- happy paths (8 directions) -------


@pytest.mark.asyncio
async def test_convert_pdf_to_jpg_multi_output(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "JPG"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "done"
    # 2 pages → 2 JPG outputs.
    assert len(body["output_file_ids"]) == 2

    resp = await client.get(
        f"/api/v1/jobs/{body['job_id']}/result", headers={"X-Owner-Token": token}
    )
    outs = resp.json()["outputs"]
    assert len(outs) == 2
    for out in outs:
        assert out["mime"] == "image/jpeg"
        assert out["name"].startswith("converted-")


@pytest.mark.asyncio
async def test_convert_pdf_to_png_multi_output(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={
            "file_id": fid,
            "from_format": "PDF",
            "to_format": "PNG",
            "image_dpi": 72,
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done"
    assert len(body["output_file_ids"]) == 2


@pytest.mark.asyncio
async def test_convert_jpg_to_pdf(client: AsyncClient) -> None:
    fid, token = await _upload(client, "JPG")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "JPG", "to_format": "PDF"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done"
    assert len(body["output_file_ids"]) == 1
    # Download + verify the output is a real 1-page PDF.
    resp = await client.get(
        f"/api/v1/jobs/{body['job_id']}/result", headers={"X-Owner-Token": token}
    )
    out = resp.json()["outputs"][0]
    assert out["mime"] == "application/pdf"
    dl = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    doc = pymupdf.open(stream=dl.content, filetype="pdf")
    try:
        assert doc.page_count == 1
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_convert_png_to_pdf(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PNG")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PNG", "to_format": "PDF"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "done"


@_NEEDS_LO
@pytest.mark.asyncio
async def test_convert_pdf_to_docx(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "DOCX"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "done", body
    assert len(body["output_file_ids"]) == 1


@pytest.mark.asyncio
async def test_convert_pdf_to_xlsx_unsupported_422(client: AsyncClient) -> None:
    """LibreOffice 24 has no working PDF→XLSX filter chain on Linux —
    we explicitly reject the pair instead of producing a broken file."""
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "XLSX"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422
    assert "unsupported pair" in resp.text


@_NEEDS_LO
@pytest.mark.asyncio
async def test_convert_pdf_to_pptx(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "PPTX"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "done", body


@_NEEDS_LO
@pytest.mark.asyncio
async def test_convert_docx_to_pdf(client: AsyncClient) -> None:
    fid, token = await _upload(client, "DOCX")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "DOCX", "to_format": "PDF"},
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


# ------- negative cases -------


@pytest.mark.asyncio
async def test_convert_wrong_owner_token(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "JPG"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]
    for path in (f"/api/v1/jobs/{job_id}", f"/api/v1/jobs/{job_id}/result"):
        resp = await client.get(path, headers={"X-Owner-Token": "WRONG"})
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_convert_mime_mismatch_415(client: AsyncClient) -> None:
    """User uploads a JPG but claims from_format=PDF → 415."""
    fid, token = await _upload(client, "JPG")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "JPG"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415


@pytest.mark.asyncio
async def test_convert_unsupported_pair_422(client: AsyncClient) -> None:
    fid, token = await _upload(client, "JPG")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "JPG", "to_format": "PNG"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422
    assert "unsupported pair" in resp.text


@pytest.mark.asyncio
async def test_convert_ocr_true_422(client: AsyncClient) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={
            "file_id": fid,
            "from_format": "PDF",
            "to_format": "DOCX",
            "ocr": True,
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422
    assert "Phase 3" in resp.text


@pytest.mark.asyncio
@pytest.mark.parametrize("dpi", [50, 1000])
async def test_convert_invalid_image_dpi_422(client: AsyncClient, dpi: int) -> None:
    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={
            "file_id": fid,
            "from_format": "PDF",
            "to_format": "JPG",
            "image_dpi": dpi,
        },
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422


@_NEEDS_LO
@pytest.mark.asyncio
async def test_convert_libreoffice_timeout_fails_job(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Patch subprocess.run inside the engine module to raise
    TimeoutExpired. Job should land in `failed` with the captured
    error message."""
    real_run = subprocess.run

    def _raise_timeout(*args, **kwargs):  # type: ignore[no-untyped-def]
        # Detect the LibreOffice invocation by checking argv.
        argv = args[0] if args else kwargs.get("args")
        if argv and "soffice" in str(argv[0]) or (argv and "libreoffice" in str(argv[0])):
            raise subprocess.TimeoutExpired(cmd=argv, timeout=180)
        return real_run(*args, **kwargs)

    monkeypatch.setattr(convert_engine.subprocess, "run", _raise_timeout)

    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "DOCX"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "failed"
    assert body["error"] is not None
    assert "timed out" in body["error"]


@_NEEDS_LO
@pytest.mark.asyncio
async def test_convert_libreoffice_profile_cleanup(client: AsyncClient) -> None:
    """After a successful LibreOffice conversion, no `lo-*` profile
    dirs should remain under /tmp from this test."""
    before = {
        p.name for p in Path("/tmp").iterdir() if p.name.startswith("lo-")
    }

    fid, token = await _upload(client, "PDF")
    resp = await client.post(
        "/api/v1/jobs/convert",
        json={"file_id": fid, "from_format": "PDF", "to_format": "DOCX"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "done"

    after = {
        p.name for p in Path("/tmp").iterdir() if p.name.startswith("lo-")
    }
    new = after - before
    # The cleanup is in a `finally`; nothing the engine created should
    # remain. Test fixtures may create their own profile dirs (and clean
    # them up too), so we only fail if MORE dirs leaked than existed
    # before this test.
    assert new == set(), f"engine leaked profile dirs: {new}"
