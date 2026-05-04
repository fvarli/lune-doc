"""Async SQLAlchemy engine + FastAPI session dependency.

Two engines exist:
  - `engine` — async asyncpg, used by routes / lifespan.
  - `sync_engine` — sync psycopg2, used by Celery workers (Celery is sync).
"""
from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import sessionmaker

from .settings import get_settings


_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None
_sync_engine = None
_sync_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            get_settings().DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency."""
    factory = get_session_factory()
    async with factory() as session:
        yield session


def get_sync_engine():
    """For Celery workers — sync psycopg2-backed."""
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(
            get_settings().DATABASE_URL_SYNC,
            echo=False,
            pool_pre_ping=True,
        )
    return _sync_engine


def get_sync_session_factory():
    global _sync_session_factory
    if _sync_session_factory is None:
        _sync_session_factory = sessionmaker(
            bind=get_sync_engine(),
            expire_on_commit=False,
        )
    return _sync_session_factory


async def ping_db() -> bool:
    """Simple `SELECT 1` to verify the DB is reachable."""
    from sqlalchemy import text

    try:
        async with get_engine().connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
