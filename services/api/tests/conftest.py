"""Shared pytest fixtures.

Tests use the `lunedoc_test` Postgres database (created in the README's
one-time setup). Each test starts with a clean `files` table — we
TRUNCATE between tests rather than drop+recreate for speed.

All async fixtures + tests share the session-scoped event loop (set in
pyproject.toml `[tool.pytest.ini_options]`) so the cached SQLAlchemy
async engine binds to one loop only.
"""
from __future__ import annotations

import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Force test-DB env vars *before* settings is imported. The .env file may
# point at the dev DB; tests must hit lunedoc_test.
os.environ["DATABASE_URL"] = os.environ.get(
    "DATABASE_URL_TEST",
    "postgresql+asyncpg://lunedoc:lunedoc_dev_password@localhost:5432/lunedoc_test",
)
os.environ["DATABASE_URL_SYNC"] = os.environ.get(
    "DATABASE_URL_SYNC_TEST",
    "postgresql+psycopg2://lunedoc:lunedoc_dev_password@localhost:5432/lunedoc_test",
)
os.environ.setdefault("OWNER_TOKEN_PEPPER", "test-pepper-not-secret")
os.environ.setdefault(
    "JWT_SECRET",
    "test-jwt-secret-not-real-padding-padding-padding",  # ≥32 bytes for HS256
)
os.environ.setdefault(
    "AUTH_CHALLENGE_PEPPER",
    "test-challenge-pepper-not-real-padding-padding",
)
os.environ.setdefault("STORAGE_ROOT", str(Path(__file__).parent / ".test-storage"))
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")  # use db 15 for tests
# Run Celery tasks synchronously in-process during tests — no broker, no worker.
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "1"


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _prepare_db():
    """Caller is responsible for running `alembic -x db=test upgrade head`
    once before tests. We additionally TRUNCATE on session start.
    """
    from lunedoc_api.db import get_engine

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE TABLE jobs, files, refresh_tokens, "
                "auth_challenges, users RESTART IDENTITY CASCADE"
            )
        )
    yield


@pytest_asyncio.fixture(autouse=True)
async def _flush_redis_per_test() -> AsyncIterator[None]:
    """Wipe the test Redis db (15) before each test — rate-limit
    counters from a prior test must not bleed in. Autouse because
    tests that don't take the `db` fixture still hit auth endpoints
    that talk to Redis.
    """
    try:
        import redis.asyncio as redis_aio

        client = redis_aio.from_url(
            os.environ["REDIS_URL"], decode_responses=True
        )
        await client.flushdb()
        await client.aclose()
    except Exception:
        pass
    yield


@pytest_asyncio.fixture
async def db() -> AsyncIterator[AsyncSession]:
    """Per-test DB session. Truncates jobs + files + auth tables."""
    from lunedoc_api.db import get_engine, get_session_factory

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE TABLE jobs, files, refresh_tokens, "
                "auth_challenges, users RESTART IDENTITY CASCADE"
            )
        )

    factory = get_session_factory()
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Async HTTP client bound to the FastAPI app via ASGI transport."""
    from lunedoc_api.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def _wipe_storage():
    """Wipe local storage root before each test."""
    from lunedoc_api.storage import get_storage, wipe_root

    storage = get_storage()
    wipe_root(storage.root)
    yield
