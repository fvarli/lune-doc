"""Phase 4 Step 3A — quota enforcement and OCR usage tracking.

Helper-direct tests cover the primitives at module level (the only
way to exercise concurrent-jobs enforcement, since
CELERY_TASK_ALWAYS_EAGER=1 would decrement before the request returns).

HTTP tests pre-fill the Redis counters to drive the routes into 429s
without spinning real workers.
"""
from __future__ import annotations

import io
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
import redis.asyncio as redis_aio
from httpx import AsyncClient

from lunedoc_api import quota
from lunedoc_api.models.job import Job
from lunedoc_api.models.user import User
from lunedoc_api.quota import (
    CONCURRENT_JOBS_LIMIT,
    JOBS_PER_HOUR_LIMIT,
    OCR_DAILY_LIMIT,
    QUOTA_CONCURRENT_JOBS,
    QUOTA_JOBS_PER_HOUR,
    QUOTA_OCR_PAGES_DAILY,
    QuotaExceededError,
    _day_bucket,
    _hour_bucket,
    _key_active,
    _key_jobs_hour,
    _key_ocr_day,
    _next_day_utc,
    _next_hour_utc,
    decrement_active_jobs,
    enforce_concurrent_jobs,
    enforce_jobs_per_hour,
    enforce_ocr_pages,
    get_ocr_pages_used_today,
    identity_for_job,
    identity_for_user,
    increment_active_jobs,
    record_job_creation,
    record_ocr_pages_sync,
)

from ._pdf_helpers import make_pdf


# Reset cached redis singletons between tests so pipeline state can't
# bleed across event loops (the shared async client is bound to the
# loop it was created on, but each test starts a fresh one).
@pytest.fixture(autouse=True)
def _reset_quota_clients():
    quota._aio_client = None
    quota._sync_client = None
    yield
    quota._aio_client = None
    quota._sync_client = None


# --- Identity helpers ------------------------------------------------


def test_identity_for_user_authenticated() -> None:
    u = User(id="abc-123", email="x@example.com")
    assert identity_for_user(u, None) == "user:abc-123"


def test_identity_for_user_anonymous_uses_hashed_token() -> None:
    ident = identity_for_user(None, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")
    assert ident.startswith("owner:")
    # Hex sha256 → 64 chars
    assert len(ident.split(":", 1)[1]) == 64


def test_identity_for_user_authenticated_takes_precedence() -> None:
    u = User(id="abc-123", email="x@example.com")
    # When both are supplied (e.g. logged-in user with their old
    # owner_token still in flight), the user identity wins.
    ident = identity_for_user(u, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")
    assert ident == "user:abc-123"


def test_identity_for_user_neither_raises() -> None:
    with pytest.raises(AssertionError):
        identity_for_user(None, None)


def test_identity_for_job_authenticated() -> None:
    job = Job(
        id="j",
        tool="merge",
        status="done",
        input_file_ids=[],
        output_file_ids=[],
        owner_token_hash="x" * 64,
        user_id="u-1",
    )
    assert identity_for_job(job) == "user:u-1"


def test_identity_for_job_anonymous() -> None:
    job = Job(
        id="j",
        tool="merge",
        status="done",
        input_file_ids=[],
        output_file_ids=[],
        owner_token_hash="hash-deadbeef",
        user_id=None,
    )
    assert identity_for_job(job) == "owner:hash-deadbeef"


# --- enforce_concurrent_jobs (helper-direct) -------------------------


async def test_enforce_concurrent_jobs_passes_under_limit() -> None:
    # 0 → enforce passes; 1, 2 also pass.
    await enforce_concurrent_jobs("user:u")  # 0 active
    await increment_active_jobs("user:u")
    await enforce_concurrent_jobs("user:u")  # 1 active
    await increment_active_jobs("user:u")
    await enforce_concurrent_jobs("user:u")  # 2 active


async def test_enforce_concurrent_jobs_blocks_at_limit() -> None:
    for _ in range(CONCURRENT_JOBS_LIMIT):
        await increment_active_jobs("user:u")
    with pytest.raises(QuotaExceededError) as excinfo:
        await enforce_concurrent_jobs("user:u")
    err = excinfo.value
    assert err.quota == QUOTA_CONCURRENT_JOBS
    assert err.limit == CONCURRENT_JOBS_LIMIT
    assert err.used == CONCURRENT_JOBS_LIMIT


async def test_decrement_active_jobs_clamps_at_zero() -> None:
    # Two extra decrements past zero — counter should not go negative.
    await decrement_active_jobs("user:u")
    await decrement_active_jobs("user:u")
    client = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        raw = await client.get(_key_active("user:u"))
        assert raw == "0"
    finally:
        await client.aclose()


# --- enforce_ocr_pages (helper-direct) -------------------------------


async def test_enforce_ocr_pages_allows_when_under_limit() -> None:
    record_ocr_pages_sync("user:u", 10)
    await enforce_ocr_pages("user:u", additional_pages=5)  # 10+5=15 <= 20


async def test_enforce_ocr_pages_allows_at_exact_limit() -> None:
    record_ocr_pages_sync("user:u", 0)
    # 0 + 20 == 20, not > 20: allowed (matches existing OCR_FREE_PAGE_CAP test).
    await enforce_ocr_pages("user:u", additional_pages=OCR_DAILY_LIMIT)


async def test_enforce_ocr_pages_blocks_overshoot() -> None:
    record_ocr_pages_sync("user:u", 19)
    with pytest.raises(QuotaExceededError) as excinfo:
        await enforce_ocr_pages("user:u", additional_pages=5)  # 19+5=24
    err = excinfo.value
    assert err.quota == QUOTA_OCR_PAGES_DAILY
    assert err.limit == OCR_DAILY_LIMIT
    assert err.used == 19


async def test_enforce_ocr_pages_blocks_when_already_at_limit() -> None:
    record_ocr_pages_sync("user:u", OCR_DAILY_LIMIT)
    with pytest.raises(QuotaExceededError):
        await enforce_ocr_pages("user:u", additional_pages=1)


# --- enforce_jobs_per_hour (helper-direct) ---------------------------


async def test_enforce_jobs_per_hour_blocks_at_limit() -> None:
    client = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        key = _key_jobs_hour("user:u", _hour_bucket(datetime.now(timezone.utc)))
        await client.set(key, JOBS_PER_HOUR_LIMIT)
    finally:
        await client.aclose()
    with pytest.raises(QuotaExceededError) as excinfo:
        await enforce_jobs_per_hour("user:u")
    assert excinfo.value.quota == QUOTA_JOBS_PER_HOUR
    assert excinfo.value.limit == JOBS_PER_HOUR_LIMIT
    assert excinfo.value.used == JOBS_PER_HOUR_LIMIT


async def test_record_job_creation_increments_hour_counter() -> None:
    await record_job_creation("user:u")
    await record_job_creation("user:u")
    client = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        key = _key_jobs_hour("user:u", _hour_bucket(datetime.now(timezone.utc)))
        assert int(await client.get(key)) == 2
    finally:
        await client.aclose()


# --- Identity isolation ---------------------------------------------


async def test_user_identities_are_isolated() -> None:
    record_ocr_pages_sync("user:alice", 15)
    record_ocr_pages_sync("user:bob", 0)
    assert await get_ocr_pages_used_today("user:alice") == 15
    assert await get_ocr_pages_used_today("user:bob") == 0


async def test_anonymous_and_authenticated_identities_are_isolated() -> None:
    record_ocr_pages_sync("user:alice", 5)
    record_ocr_pages_sync("owner:somehash", 12)
    assert await get_ocr_pages_used_today("user:alice") == 5
    assert await get_ocr_pages_used_today("owner:somehash") == 12


# --- Bucket / reset-time helpers ------------------------------------


async def test_record_ocr_pages_sync_does_not_leak_across_days() -> None:
    """Manually write a value into yesterday's key; today's reader sees 0."""
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    client = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        await client.set(_key_ocr_day("user:u", _day_bucket(yesterday)), 99)
    finally:
        await client.aclose()
    assert await get_ocr_pages_used_today("user:u") == 0


async def test_jobs_per_hour_does_not_leak_across_hours() -> None:
    now = datetime.now(timezone.utc)
    last_hour = now - timedelta(hours=1)
    client = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        await client.set(
            _key_jobs_hour("user:u", _hour_bucket(last_hour)),
            JOBS_PER_HOUR_LIMIT,
        )
    finally:
        await client.aclose()
    # Last hour is full but current hour is empty → should pass.
    await enforce_jobs_per_hour("user:u")


def test_next_day_utc_is_midnight() -> None:
    now = datetime(2026, 5, 9, 13, 24, 35, tzinfo=timezone.utc)
    nxt = _next_day_utc(now)
    assert nxt == datetime(2026, 5, 10, 0, 0, 0, tzinfo=timezone.utc)


def test_next_hour_utc_is_top_of_hour() -> None:
    now = datetime(2026, 5, 9, 13, 24, 35, tzinfo=timezone.utc)
    nxt = _next_hour_utc(now)
    assert nxt == datetime(2026, 5, 9, 14, 0, 0, tzinfo=timezone.utc)


# --- HTTP-route enforcement -----------------------------------------


async def _upload_pdf(
    client: AsyncClient,
    name: str,
    page_count: int,
    token: str | None = None,
) -> tuple[str, str]:
    """Upload a PDF. When `token` is supplied (and valid format), the
    server reuses it so multiple inputs can share an owner_token —
    needed for merge tests."""
    pdf = make_pdf(name, page_count=page_count)
    headers = {"X-Owner-Token": token} if token else {}
    resp = await client.post(
        "/api/v1/files",
        files={"file": (name, io.BytesIO(pdf), "application/octet-stream")},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["file_id"], body["owner_token"]


async def test_jobs_per_hour_429_at_route(client: AsyncClient) -> None:
    """Pre-fill the jobs/hour counter to JOBS_PER_HOUR_LIMIT and verify
    the next merge job creation returns 429 with the locked payload."""
    fid_a, token = await _upload_pdf(client, "a.pdf", page_count=1)
    fid_b, _ = await _upload_pdf(client, "b.pdf", page_count=1, token=token)

    aio = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        identity = f"owner:{__import__('lunedoc_api.owner_token', fromlist=['hash_token']).hash_token(token)}"
        key = _key_jobs_hour(identity, _hour_bucket(datetime.now(timezone.utc)))
        await aio.set(key, JOBS_PER_HOUR_LIMIT)
    finally:
        await aio.aclose()

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_a, fid_b]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 429
    detail = resp.json()["detail"]
    assert detail["code"] == "quota_exceeded"
    assert detail["quota"] == QUOTA_JOBS_PER_HOUR
    assert detail["limit"] == JOBS_PER_HOUR_LIMIT
    assert detail["used"] == JOBS_PER_HOUR_LIMIT


async def test_concurrent_jobs_429_at_route(client: AsyncClient) -> None:
    fid_a, token = await _upload_pdf(client, "a.pdf", page_count=1)
    fid_b, _ = await _upload_pdf(client, "b.pdf", page_count=1, token=token)

    aio = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        identity = f"owner:{__import__('lunedoc_api.owner_token', fromlist=['hash_token']).hash_token(token)}"
        await aio.set(_key_active(identity), CONCURRENT_JOBS_LIMIT)
    finally:
        await aio.aclose()

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_a, fid_b]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 429
    detail = resp.json()["detail"]
    assert detail["quota"] == QUOTA_CONCURRENT_JOBS
    assert detail["limit"] == CONCURRENT_JOBS_LIMIT
    assert detail["used"] == CONCURRENT_JOBS_LIMIT


async def test_ocr_pages_daily_429_at_route(client: AsyncClient) -> None:
    """OCR overshoot pre-check: pre-fill counter to 19, submit a 5-page
    PDF, expect 429 with `ocr_pages_daily`. The route's own page-cap
    check (21 > 20) does not fire here — page_count = 5 ≤ 20 — so the
    daily-quota check is what blocks the request."""
    from lunedoc_api.owner_token import hash_token as _hash

    fid, token = await _upload_pdf(client, "p.pdf", page_count=5)

    aio = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        identity = f"owner:{_hash(token)}"
        await aio.set(
            _key_ocr_day(identity, _day_bucket(datetime.now(timezone.utc))),
            19,
        )
    finally:
        await aio.aclose()

    resp = await client.post(
        "/api/v1/jobs/ocr",
        json={"file_id": fid, "mode": "extract", "lang": "eng"},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 429, resp.text
    detail = resp.json()["detail"]
    assert detail["quota"] == QUOTA_OCR_PAGES_DAILY
    assert detail["limit"] == OCR_DAILY_LIMIT
    assert detail["used"] == 19


async def test_429_payload_shape_complete(client: AsyncClient) -> None:
    """Verify the 429 response carries every field documented in the
    Step 3A spec, with reset_at as ISO-8601 UTC ending in `Z`."""
    from lunedoc_api.owner_token import hash_token as _hash

    fid_a, token = await _upload_pdf(client, "a.pdf", page_count=1)
    fid_b, _ = await _upload_pdf(client, "b.pdf", page_count=1, token=token)

    aio = redis_aio.from_url(
        quota.get_settings().REDIS_URL, decode_responses=True
    )
    try:
        identity = f"owner:{_hash(token)}"
        key = _key_jobs_hour(identity, _hour_bucket(datetime.now(timezone.utc)))
        await aio.set(key, JOBS_PER_HOUR_LIMIT)
    finally:
        await aio.aclose()

    resp = await client.post(
        "/api/v1/jobs/merge",
        json={"file_ids": [fid_a, fid_b]},
        headers={"X-Owner-Token": token},
    )
    assert resp.status_code == 429
    detail = resp.json()["detail"]
    assert set(detail.keys()) == {"code", "quota", "limit", "used", "reset_at"}
    assert detail["code"] == "quota_exceeded"
    assert detail["reset_at"].endswith("Z")
    parsed = datetime.fromisoformat(detail["reset_at"].replace("Z", "+00:00"))
    assert parsed.tzinfo is not None


# --- /me/usage integration ------------------------------------------


async def test_me_usage_returns_recorded_ocr_pages(
    client: AsyncClient,
) -> None:
    """A successful OCR run records pages via record_ocr_pages_sync;
    /me/usage reads the same key and surfaces the count. We simulate
    completion directly so this test doesn't depend on Tesseract."""
    # Sign in (reuse the existing email-flow helper inline).
    from lunedoc_api.auth.email import CapturingEmailSender
    from lunedoc_api.main import app
    from lunedoc_api.routes.auth import get_email_sender

    sender = CapturingEmailSender()
    app.dependency_overrides[get_email_sender] = lambda: sender
    try:
        await client.post(
            "/api/v1/auth/email/start", json={"email": "x@example.com"}
        )
        code = next(
            line.strip()
            for line in sender.last.body_text.splitlines()
            if line.strip().isdigit() and len(line.strip()) == 6
        )
        verify = await client.post(
            "/api/v1/auth/email/verify",
            json={"email": "x@example.com", "code": code},
        )
        tokens = verify.json()
    finally:
        app.dependency_overrides.pop(get_email_sender, None)

    user_id = tokens["user"]["id"]
    record_ocr_pages_sync(f"user:{user_id}", 7)

    r = await client.get(
        "/api/v1/me/usage",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json()["ocr_pages_used_today"] == 7
