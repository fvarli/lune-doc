"""POST/GET/DELETE/download lifecycle tests."""
from __future__ import annotations

import io

import pytest
from httpx import AsyncClient


# Minimal valid PDF (~600 bytes). Recognized by libmagic as application/pdf.
SAMPLE_PDF = (
    b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
    b"/Resources << >> >>\nendobj\n"
    b"4 0 obj\n<< /Length 44 >>\nstream\n"
    b"BT /F1 24 Tf 100 700 Td (Hello Lunedoc) Tj ET\nendstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n"
    b"0000000111 00000 n \n0000000202 00000 n \n"
    b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n290\n%%EOF\n"
)


@pytest.mark.asyncio
async def test_round_trip_upload_get_download_delete(client: AsyncClient) -> None:
    # Upload
    resp = await client.post(
        "/api/v1/files",
        files={"file": ("hello.pdf", io.BytesIO(SAMPLE_PDF), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    file_id = body["file_id"]
    token = body["owner_token"]
    assert body["mime"] == "application/pdf"
    assert body["size"] == len(SAMPLE_PDF)
    assert body["name"] == "hello.pdf"
    assert body["expires_at"]

    # Get metadata — wrong token should 404
    resp_bad = await client.get(
        f"/api/v1/files/{file_id}", headers={"X-Owner-Token": "WRONG"}
    )
    assert resp_bad.status_code == 404

    # Get metadata — right token
    resp = await client.get(
        f"/api/v1/files/{file_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200
    md = resp.json()
    assert md["file_id"] == file_id
    assert md["mime"] == "application/pdf"

    # Download — bytes match
    resp = await client.get(
        f"/api/v1/files/{file_id}/download", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200
    assert resp.content == SAMPLE_PDF
    assert "attachment" in resp.headers["content-disposition"]

    # Idempotent delete — first call 204
    resp = await client.delete(
        f"/api/v1/files/{file_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 204

    # Second call 204 (no-op)
    resp = await client.delete(
        f"/api/v1/files/{file_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 204

    # Subsequent metadata fetch 404
    resp = await client.get(
        f"/api/v1/files/{file_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_mime_reject(client: AsyncClient) -> None:
    """Uploading something that isn't on the whitelist is 415."""
    bogus = b"#!/bin/sh\necho not a pdf\n"
    resp = await client.post(
        "/api/v1/files",
        files={"file": ("evil.sh", io.BytesIO(bogus), "application/pdf")},
    )
    assert resp.status_code == 415, resp.text


@pytest.mark.asyncio
async def test_size_cap(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Uploading more than MAX_UPLOAD_BYTES is 413."""
    # Shrink the cap for the test by patching settings.
    from lunedoc_api import settings as settings_module

    s = settings_module.get_settings()
    monkeypatch.setattr(s, "MAX_UPLOAD_BYTES", 256)

    big = SAMPLE_PDF + b"x" * 1024  # well over 256 bytes
    resp = await client.post(
        "/api/v1/files",
        files={"file": ("big.pdf", io.BytesIO(big), "application/octet-stream")},
    )
    assert resp.status_code == 413, resp.text


@pytest.mark.asyncio
async def test_delete_unknown_id_returns_204(client: AsyncClient) -> None:
    """Per §6.4 — DELETE never leaks existence; always 204."""
    resp = await client.delete(
        "/api/v1/files/00000000-0000-0000-0000-000000000000",
        headers={"X-Owner-Token": "anything"},
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_get_unknown_id_returns_404(client: AsyncClient) -> None:
    resp = await client.get(
        "/api/v1/files/00000000-0000-0000-0000-000000000000",
        headers={"X-Owner-Token": "anything"},
    )
    assert resp.status_code == 404
