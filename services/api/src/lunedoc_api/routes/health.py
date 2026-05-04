"""GET /api/v1/healthz — liveness + DB + Redis ping."""
from __future__ import annotations

import redis.asyncio as redis_async
from fastapi import APIRouter

from .. import __version__
from ..db import ping_db
from ..settings import get_settings

router = APIRouter()


@router.get("/healthz", summary="Service health")
async def healthz() -> dict:
    db_ok = await ping_db()

    redis_ok = False
    try:
        client = redis_async.from_url(get_settings().REDIS_URL)
        await client.ping()
        await client.aclose()
        redis_ok = True
    except Exception:
        redis_ok = False

    return {
        "status": "ok" if (db_ok and redis_ok) else "degraded",
        "version": __version__,
        "db": "ok" if db_ok else "unreachable",
        "redis": "ok" if redis_ok else "unreachable",
    }
