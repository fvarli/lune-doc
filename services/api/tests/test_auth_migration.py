"""Smoke tests for the 0004 migration via the new ORM models.

Confirms the schema applied and the ORM mapping is consistent. Does
not exercise endpoints — those tests live in their own files.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from lunedoc_api.models import AuthChallenge, RefreshToken, User


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def test_can_insert_user_minimal(db: AsyncSession) -> None:
    user = User(
        id=str(uuid.uuid4()),
        email="alice@example.com",
        email_verified_at=_now(),
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(user)
    await db.commit()

    fetched = (await db.execute(select(User).where(User.id == user.id))).scalar_one()
    assert fetched.email == "alice@example.com"
    assert fetched.display_name is None
    assert fetched.disabled_at is None


async def test_email_unique_constraint_is_case_insensitive(db: AsyncSession) -> None:
    """citext defense-in-depth: even if the app forgets to lowercase,
    the unique index still blocks duplicates that differ only in case.
    The app layer is expected to normalize emails to lowercase at the
    boundary; this test guarantees the DB catches a slip-up.
    """
    db.add(
        User(
            id=str(uuid.uuid4()),
            email="Dup@example.com",
            email_verified_at=_now(),
            created_at=_now(),
            updated_at=_now(),
        )
    )
    await db.commit()

    db.add(
        User(
            id=str(uuid.uuid4()),
            email="dup@example.com",
            email_verified_at=_now(),
            created_at=_now(),
            updated_at=_now(),
        )
    )
    with pytest.raises(IntegrityError):
        await db.commit()
    await db.rollback()


async def test_can_insert_auth_challenge(db: AsyncSession) -> None:
    row = AuthChallenge(
        id=str(uuid.uuid4()),
        email="alice@example.com",
        purpose="login",
        code_hash="0" * 64,
        link_token_hash="1" * 64,
        attempts=0,
        expires_at=_now() + timedelta(minutes=15),
        created_at=_now(),
    )
    db.add(row)
    await db.commit()

    fetched = (
        await db.execute(select(AuthChallenge).where(AuthChallenge.id == row.id))
    ).scalar_one()
    assert fetched.attempts == 0
    assert fetched.consumed_at is None
    assert fetched.purpose == "login"


async def test_can_insert_refresh_token_with_self_fk(db: AsyncSession) -> None:
    user = User(
        id=str(uuid.uuid4()),
        email="bob@example.com",
        email_verified_at=_now(),
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(user)
    await db.flush()

    parent = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash="a" * 64,
        issued_at=_now(),
        expires_at=_now() + timedelta(days=30),
    )
    db.add(parent)
    await db.flush()

    child = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash="b" * 64,
        parent_id=parent.id,
        issued_at=_now(),
        expires_at=_now() + timedelta(days=30),
    )
    db.add(child)
    # Flush child before assigning parent.replaced_by_id so the FK
    # target row exists at the time the UPDATE on parent runs.
    await db.flush()
    parent.replaced_by_id = child.id
    await db.commit()

    fetched_parent = (
        await db.execute(select(RefreshToken).where(RefreshToken.id == parent.id))
    ).scalar_one()
    assert fetched_parent.replaced_by_id == child.id


async def test_refresh_token_cascades_on_user_delete(db: AsyncSession) -> None:
    user = User(
        id=str(uuid.uuid4()),
        email="carol@example.com",
        email_verified_at=_now(),
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(user)
    await db.flush()

    rt = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash="c" * 64,
        issued_at=_now(),
        expires_at=_now() + timedelta(days=30),
    )
    db.add(rt)
    await db.commit()

    await db.delete(user)
    await db.commit()

    fetched = (
        await db.execute(select(RefreshToken).where(RefreshToken.id == rt.id))
    ).scalar_one_or_none()
    assert fetched is None
