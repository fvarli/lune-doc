"""Redis-backed sliding-window-ish rate limiter.

Single key per (subject, hour). Increment + expire pattern; counts
reset on the hour. Coarse but adequate for `/auth/email/start`'s
"don't spam mailboxes" use case.

Fails open on any Redis error — degraded correctness is preferable
to a hard outage that locks users out of sign-in.
"""
from __future__ import annotations

import logging

import redis.asyncio as redis_aio
from redis.exceptions import RedisError

from ..settings import get_settings

_log = logging.getLogger("lunedoc.auth.ratelimit")
_client: redis_aio.Redis | None = None


def _get_redis() -> redis_aio.Redis:
    global _client
    if _client is None:
        _client = redis_aio.from_url(get_settings().REDIS_URL, decode_responses=True)
    return _client


async def hit_and_check(key: str, *, limit: int, window_seconds: int) -> bool:
    """Increment counter and return True iff the new count exceeds `limit`.

    On any Redis error: log and return False (fail open).
    """
    try:
        client = _get_redis()
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()
        count = int(results[0])
        return count > limit
    except (RedisError, OSError) as exc:
        _log.warning("rate-limit Redis unavailable; failing open (%s)", exc)
        return False
