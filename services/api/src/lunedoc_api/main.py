"""Lunedoc API — FastAPI app + lifespan + route registration."""
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .quota import QuotaExceededError
from .routes import auth, files, health, jobs, me
from .settings import get_settings


@asynccontextmanager
async def _lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # Resolve settings on startup so missing env vars surface immediately.
    get_settings()
    yield


app = FastAPI(
    title="Lunedoc API",
    version=__version__,
    lifespan=_lifespan,
    docs_url="/docs",
    redoc_url=None,
)


@app.exception_handler(QuotaExceededError)
async def _quota_exceeded_handler(
    _request: Request, exc: QuotaExceededError
) -> JSONResponse:
    """Translate quota errors into HTTP 429 with a structured payload.

    `reset_at` is emitted as ISO-8601 UTC with the trailing `Z` so
    clients can parse it without dealing with `+00:00`.
    """
    reset_at = exc.reset_at.isoformat()
    if reset_at.endswith("+00:00"):
        reset_at = reset_at[:-6] + "Z"
    return JSONResponse(
        status_code=429,
        content={
            "detail": {
                "code": "quota_exceeded",
                "quota": exc.quota,
                "limit": exc.limit,
                "used": exc.used,
                "reset_at": reset_at,
            }
        },
    )


cors = get_settings().CORS_ORIGINS
if cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# All endpoints under /api/v1.
API_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_PREFIX, tags=["health"])
app.include_router(files.router, prefix=API_PREFIX, tags=["files"])
app.include_router(jobs.router, prefix=API_PREFIX, tags=["jobs"])
app.include_router(auth.router, prefix=API_PREFIX, tags=["auth"])
app.include_router(me.router, prefix=API_PREFIX, tags=["me"])
