"""Lunedoc API — FastAPI app + lifespan + route registration."""
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
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
