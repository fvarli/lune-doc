"""Merge job end-to-end tests.

Covers:
  - Happy path: upload 2 → merge → poll → result → download → verify pages.
  - Wrong owner_token on status / result → 404 (no leak).
  - Caller doesn't own one of the input files → 404 (no leak).
  - Non-PDF input rejected → 415.
  - Single file rejected (need >= 2) → 422 (pydantic).
  - Result polled before done → 409 (impossible in eager mode but
    still verified by inserting a fake queued job manually).
"""
from __future__ import annotations

import io

import pymupdf
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from lunedoc_api.models.job import Job

from ._pdf_helpers import make_pdf


async def _upload(client: AsyncClient, name: str, content: bytes) -> tuple[str, str]:
    """Upload `content` as `name`. Returns (file_id, owner_token)."""
    resp = await client.post(
        "/api/v1/files",
        files={"file": (name, io.BytesIO(content), "application/octet-stream")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["file_id"], body["owner_token"]


async def _upload_with_token(
    client: AsyncClient, name: str, content: bytes
) -> tuple[str, str]:
    return await _upload(client, name, content)


@pytest.mark.asyncio
async def test_merge_round_trip(client: AsyncClient) -> None:
    """Two PDFs (2 + 3 pages) → merged 5-page PDF, downloadable, openable."""
    pdf_a = make_pdf("alpha", page_count=2)
    pdf_b = make_pdf("beta", page_count=3)

    fid_a, token = await _upload(client, "alpha.pdf", pdf_a)
    # Reuse the same token for B by attaching it (each upload mints its own,
    # but for the merge test we need a single token that owns both).
    # Simpler: upload B and just use B's token; then we need to re-upload A
    # with B's token. Easier still: use distinct uploads and verify the merge
    # rejects when tokens diverge — separate test below.
    fid_b, token_b = await _upload(client, "beta.pdf", pdf_b)

    # Each upload gets its own token. For round-trip, we need a job whose
    # owner_token owns both inputs. Upload both with the same shared flow:
    # the upload endpoint mints fresh tokens, so we test the multi-token
    # case in test_merge_rejects_unowned_input. Here, upload twice and
    # bypass by using a single canonical owner: re-upload B under A's
    # token by deleting B and re-uploading? No — uploads always mint.
    #
    # Cleanest: post merge with `token`, expect 404 because B isn't owned
    # by `token`. To exercise the happy path we need the route to accept
    # both files under one token. Approach: upload both files, then
    # forge ownership in the DB by setting both files' owner_token_hash
    # to hash(token). That's pure test infrastructure.
    from lunedoc_api.db import get_session_factory
    from lunedoc_api.owner_token import hash_token
    from lunedoc_api.models.file import File

    factory = get_session_factory()
    async with factory() as s:
        for fid in (fid_a, fid_b):
            f = (await s.execute(select(File).where(File.id == fid))).scalar_one()
            f.owner_token_hash = hash_token(token)
        await s.commit()

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_a, fid_b]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    job_id = body["job_id"]
    # In eager mode the task ran synchronously during the POST.
    assert body["status"] == "done", body
    assert body["tool"] == "merge"
    assert body["input_file_ids"] == [fid_a, fid_b]
    assert len(body["output_file_ids"]) == 1
    assert body["error"] is None

    # Status endpoint
    resp = await client.get(
        f"/api/v1/jobs/{job_id}", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "done"

    # Result endpoint
    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": token}
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert result["job_id"] == job_id
    assert len(result["outputs"]) == 1
    out = result["outputs"][0]
    assert out["mime"] == "application/pdf"
    assert out["name"].startswith("merged-")
    assert out["download_url"] == f"/api/v1/files/{out['file_id']}/download"

    # Download merged PDF and verify page order.
    resp = await client.get(out["download_url"], headers={"X-Owner-Token": token})
    assert resp.status_code == 200
    merged_bytes = resp.content
    doc = pymupdf.open(stream=merged_bytes, filetype="pdf")
    try:
        assert doc.page_count == 5  # 2 + 3
        # alpha pages first, then beta pages
        assert "alpha" in doc[0].get_text()
        assert "alpha" in doc[1].get_text()
        assert "beta" in doc[2].get_text()
        assert "beta" in doc[3].get_text()
        assert "beta" in doc[4].get_text()
    finally:
        doc.close()


@pytest.mark.asyncio
async def test_wrong_owner_token_on_status_returns_404(client: AsyncClient) -> None:
    pdf_a = make_pdf("alpha", 1)
    pdf_b = make_pdf("beta", 1)
    fid_a, token = await _upload(client, "a.pdf", pdf_a)
    fid_b, _ = await _upload(client, "b.pdf", pdf_b)

    # Forge shared ownership for the route.
    from lunedoc_api.db import get_session_factory
    from lunedoc_api.owner_token import hash_token
    from lunedoc_api.models.file import File

    factory = get_session_factory()
    async with factory() as s:
        for fid in (fid_a, fid_b):
            f = (await s.execute(select(File).where(File.id == fid))).scalar_one()
            f.owner_token_hash = hash_token(token)
        await s.commit()

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_a, fid_b]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    resp = await client.get(
        f"/api/v1/jobs/{job_id}", headers={"X-Owner-Token": "WRONG"}
    )
    assert resp.status_code == 404

    resp = await client.get(
        f"/api/v1/jobs/{job_id}/result", headers={"X-Owner-Token": "WRONG"}
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_merge_rejects_unowned_input(client: AsyncClient) -> None:
    """If the caller's token doesn't own one of the inputs, the route
    returns 404 (no existence leak) and never enqueues the job."""
    pdf_a = make_pdf("alpha", 1)
    pdf_b = make_pdf("beta", 1)
    fid_a, token_a = await _upload(client, "a.pdf", pdf_a)
    fid_b, _token_b = await _upload(client, "b.pdf", pdf_b)
    # Don't forge ownership — fid_b is owned by a different token.

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_a, fid_b]},
        headers={"X-Owner-Token": token_a},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_merge_rejects_non_pdf_input(client: AsyncClient) -> None:
    """If a uploaded input is not a PDF, route rejects with 415.

    Uploads a PNG (also on the upload whitelist) alongside a PDF,
    forges shared ownership, then tries to merge.
    """
    # Valid 1×1 PNG bytes
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfa\xff"
        b"\xff?\x03\x00\x05\xfe\x02\xfe\xa7VG\xd1\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    pdf = make_pdf("alpha", 1)
    fid_pdf, token = await _upload(client, "ok.pdf", pdf)
    fid_png, _ = await _upload(client, "img.png", png_bytes)

    from lunedoc_api.db import get_session_factory
    from lunedoc_api.owner_token import hash_token
    from lunedoc_api.models.file import File

    factory = get_session_factory()
    async with factory() as s:
        for fid in (fid_pdf, fid_png):
            f = (await s.execute(select(File).where(File.id == fid))).scalar_one()
            f.owner_token_hash = hash_token(token)
        await s.commit()

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_pdf, fid_png]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 415, resp.text
    assert "not a PDF" in resp.text


@pytest.mark.asyncio
async def test_merge_requires_two_files(client: AsyncClient) -> None:
    pdf = make_pdf("solo", 1)
    fid, token = await _upload(client, "s.pdf", pdf)

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_result_endpoint_409_when_not_done(client: AsyncClient, db) -> None:
    """Insert a `queued` job by hand and confirm result returns 409.

    (Eager mode would otherwise always run the task synchronously during
    POST, so the route never observes queued/running.)
    """
    from datetime import datetime, timezone
    from lunedoc_api.owner_token import hash_token

    job = Job(
        id="11111111-1111-1111-1111-111111111111",
        tool="merge",
        status="queued",
        input_file_ids=[],
        output_file_ids=[],
        owner_token_hash=hash_token("FAKE"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(job)
    await db.commit()

    resp = await client.get(
        f"/api/v1/jobs/{job.id}/result", headers={"X-Owner-Token": "FAKE"}
    )
    assert resp.status_code == 409
    assert "not finished" in resp.text


@pytest.mark.asyncio
async def test_failed_job_result_returns_422(client: AsyncClient, db) -> None:
    from datetime import datetime, timezone
    from lunedoc_api.owner_token import hash_token

    job = Job(
        id="22222222-2222-2222-2222-222222222222",
        tool="merge",
        status="failed",
        input_file_ids=[],
        output_file_ids=[],
        error="MergeError: input file missing: a.pdf",
        owner_token_hash=hash_token("FAKE"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(job)
    await db.commit()

    resp = await client.get(
        f"/api/v1/jobs/{job.id}/result", headers={"X-Owner-Token": "FAKE"}
    )
    assert resp.status_code == 422
    assert "MergeError" in resp.text
