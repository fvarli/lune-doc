"""Redis-backed free-tier quota enforcement.

Three independent quotas, all keyed by an identity string:

  - OCR pages/day:   `quota:ocr:{identity}:{YYYYMMDD}`   (UTC, TTL 3 days)
  - Jobs/hour:       `quota:jobs:{identity}:{YYYYMMDDHH}` (UTC, TTL 2 hours)
  - Concurrent jobs: `quota:active:{identity}`            (TTL 24 hours)

`identity` is `user:<uuid>` for authenticated callers and
`owner:<hex_hmac_sha256>` for anonymous owner-token-only callers.

Fail-closed on Redis errors during *enforcement* (a Redis outage must
not become an abuse vector). The post-fact accounting helpers
(`record_ocr_pages`, `decrement_active_jobs`) swallow Redis errors and
log instead — they run in `finally` blocks where raising would mask
the real outcome.

Async functions are called from the FastAPI route layer; their `_sync`
siblings are called from Celery worker tasks, which are sync.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

import redis as redis_sync
import redis.asyncio as redis_aio
from redis.exceptions import RedisError

from .owner_token import hash_token
from .settings import get_settings

if TYPE_CHECKING:
    from .models.job import Job
    from .models.user import User


_log = logging.getLogger("lunedoc.quota")

# --- Free-tier limits (locked) ---------------------------------------

OCR_DAILY_LIMIT = 20
JOBS_PER_HOUR_LIMIT = 60
CONCURRENT_JOBS_LIMIT = 3

QUOTA_OCR_PAGES_DAILY = "ocr_pages_daily"
QUOTA_JOBS_PER_HOUR = "jobs_per_hour"
QUOTA_CONCURRENT_JOBS = "concurrent_jobs"

_OCR_TTL_SECONDS = 3 * 24 * 3600
_JOBS_TTL_SECONDS = 2 * 3600
_ACTIVE_TTL_SECONDS = 24 * 3600


# --- Redis clients (singletons) --------------------------------------

_aio_client: redis_aio.Redis | None = None
_sync_client: redis_sync.Redis | None = None


def _get_aio() -> redis_aio.Redis:
    global _aio_client
    if _aio_client is None:
        _aio_client = redis_aio.from_url(
            get_settings().REDIS_URL, decode_responses=True
        )
    return _aio_client


def _get_sync() -> redis_sync.Redis:
    global _sync_client
    if _sync_client is None:
        _sync_client = redis_sync.from_url(
            get_settings().REDIS_URL, decode_responses=True
        )
    return _sync_client


# --- Identity resolution ---------------------------------------------


def identity_for_user(user: "User | None", owner_token: str | None) -> str:
    """Return `user:<id>` if authenticated, else `owner:<hash>`.

    Caller must guarantee at least one is present (the routes already
    return 404 when neither is). Asserts in case of bug.
    """
    if user is not None:
        return f"user:{user.id}"
    if owner_token:
        return f"owner:{hash_token(owner_token)}"
    raise AssertionError("identity_for_user: no user or owner_token")


def identity_for_job(job: "Job") -> str:
    """Resolve identity from a Job row (used by sync workers)."""
    if job.user_id:
        return f"user:{job.user_id}"
    return f"owner:{job.owner_token_hash}"


# --- Time helpers (UTC) ----------------------------------------------


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _day_bucket(now: datetime) -> str:
    return now.strftime("%Y%m%d")


def _hour_bucket(now: datetime) -> str:
    return now.strftime("%Y%m%d%H")


def _next_day_utc(now: datetime) -> datetime:
    tomorrow = (now + timedelta(days=1)).date()
    return datetime(tomorrow.year, tomorrow.month, tomorrow.day, tzinfo=timezone.utc)


def _next_hour_utc(now: datetime) -> datetime:
    return now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


# --- Exception -------------------------------------------------------


class QuotaExceededError(Exception):
    """Raised by enforce_* helpers when a free-tier limit is hit.

    The global handler in `main.py` translates this to HTTP 429 with
    the `code/quota/limit/used/reset_at` payload.
    """

    def __init__(
        self, *, quota: str, limit: int, used: int, reset_at: datetime
    ) -> None:
        super().__init__(f"quota_exceeded: {quota} (used={used}, limit={limit})")
        self.quota = quota
        self.limit = limit
        self.used = used
        self.reset_at = reset_at


# --- Key builders ----------------------------------------------------


def _key_ocr_day(identity: str, day: str) -> str:
    return f"quota:ocr:{identity}:{day}"


def _key_jobs_hour(identity: str, hour: str) -> str:
    return f"quota:jobs:{identity}:{hour}"


def _key_active(identity: str) -> str:
    return f"quota:active:{identity}"


# --- Enforcement (async, fail-closed on Redis error) -----------------


async def enforce_jobs_per_hour(identity: str) -> None:
    now = _utc_now()
    key = _key_jobs_hour(identity, _hour_bucket(now))
    raw = await _get_aio().get(key)
    used = int(raw) if raw else 0
    if used >= JOBS_PER_HOUR_LIMIT:
        raise QuotaExceededError(
            quota=QUOTA_JOBS_PER_HOUR,
            limit=JOBS_PER_HOUR_LIMIT,
            used=used,
            reset_at=_next_hour_utc(now),
        )


async def enforce_concurrent_jobs(identity: str) -> None:
    raw = await _get_aio().get(_key_active(identity))
    used = int(raw) if raw else 0
    if used >= CONCURRENT_JOBS_LIMIT:
        raise QuotaExceededError(
            quota=QUOTA_CONCURRENT_JOBS,
            limit=CONCURRENT_JOBS_LIMIT,
            used=used,
            reset_at=_utc_now() + timedelta(minutes=5),
        )


async def enforce_ocr_pages(identity: str, additional_pages: int) -> None:
    """Reject when `used + additional_pages > limit`.

    `additional_pages` is the page count of the job about to run.
    Lets us catch a 5-page job at 19/20 used (would push to 24).
    """
    now = _utc_now()
    key = _key_ocr_day(identity, _day_bucket(now))
    raw = await _get_aio().get(key)
    used = int(raw) if raw else 0
    if used + additional_pages > OCR_DAILY_LIMIT:
        raise QuotaExceededError(
            quota=QUOTA_OCR_PAGES_DAILY,
            limit=OCR_DAILY_LIMIT,
            used=used,
            reset_at=_next_day_utc(now),
        )


# --- Counter mutators (async, used by routes) ------------------------


async def increment_active_jobs(identity: str) -> None:
    pipe = _get_aio().pipeline()
    pipe.incr(_key_active(identity))
    pipe.expire(_key_active(identity), _ACTIVE_TTL_SECONDS)
    await pipe.execute()


async def decrement_active_jobs(identity: str) -> None:
    """Decrement the active-job counter, clamping at zero.

    Errors are swallowed: this is called from rollback paths where
    raising would mask the original failure.
    """
    try:
        client = _get_aio()
        new = int(await client.decr(_key_active(identity)))
        if new < 0:
            await client.set(_key_active(identity), 0)
    except (RedisError, OSError) as exc:
        _log.warning("decrement_active_jobs: redis error (%s)", exc)


async def record_job_creation(identity: str) -> None:
    now = _utc_now()
    key = _key_jobs_hour(identity, _hour_bucket(now))
    pipe = _get_aio().pipeline()
    pipe.incr(key)
    pipe.expire(key, _JOBS_TTL_SECONDS)
    await pipe.execute()


async def get_ocr_pages_used_today(identity: str) -> int:
    """Read-only — used by /me/usage. Fail-soft to 0 on Redis error."""
    try:
        raw = await _get_aio().get(_key_ocr_day(identity, _day_bucket(_utc_now())))
        return int(raw) if raw else 0
    except (RedisError, OSError) as exc:
        _log.warning("get_ocr_pages_used_today: redis error (%s)", exc)
        return 0


# --- Sync helpers (worker-side) --------------------------------------


def decrement_active_jobs_sync(identity: str) -> None:
    """Sync counterpart of `decrement_active_jobs` for Celery tasks."""
    try:
        client = _get_sync()
        new = int(client.decr(_key_active(identity)))
        if new < 0:
            client.set(_key_active(identity), 0)
    except (RedisError, OSError) as exc:
        _log.warning("decrement_active_jobs_sync: redis error (%s)", exc)


def record_ocr_pages_sync(identity: str, pages: int) -> None:
    """Sync OCR pages accumulator, called from the OCR worker on success."""
    if pages <= 0:
        return
    try:
        now = _utc_now()
        key = _key_ocr_day(identity, _day_bucket(now))
        pipe = _get_sync().pipeline()
        pipe.incrby(key, pages)
        pipe.expire(key, _OCR_TTL_SECONDS)
        pipe.execute()
    except (RedisError, OSError) as exc:
        _log.warning("record_ocr_pages_sync: redis error (%s)", exc)
