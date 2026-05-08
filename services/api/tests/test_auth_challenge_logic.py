"""Challenge primitives — generate / verify / attempts / supersede.

Exercises auth/challenge.py end-to-end against the live test DB
(no mocks) — the helpers commit to `auth_challenges` directly.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from lunedoc_api.auth.challenge import (
    PURPOSE_LOGIN,
    create_challenge,
    is_valid_code_format,
    normalize_email,
    verify_challenge,
)
from lunedoc_api.models.auth_challenge import AuthChallenge


def test_normalize_email_lowercases_and_strips() -> None:
    assert normalize_email("  Foo@Example.com  ") == "foo@example.com"


def test_is_valid_code_format() -> None:
    assert is_valid_code_format("123456")
    assert not is_valid_code_format("12345")
    assert not is_valid_code_format("1234567")
    assert not is_valid_code_format("12345a")
    assert not is_valid_code_format("")


async def test_create_challenge_inserts_row_with_zero_attempts(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    assert len(out.code) == 6 and out.code.isdigit()
    assert len(out.link_token) == 32
    rows = (await db.execute(select(AuthChallenge))).scalars().all()
    assert len(rows) == 1
    row = rows[0]
    assert row.attempts == 0
    assert row.consumed_at is None
    assert row.purpose == PURPOSE_LOGIN
    # Hashes are NOT the plaintext.
    assert row.code_hash != out.code
    assert row.link_token_hash != out.link_token


async def test_create_challenge_supersedes_prior(db: AsyncSession) -> None:
    first = await create_challenge(db, email="alice@example.com")
    await db.commit()
    second = await create_challenge(db, email="alice@example.com")
    await db.commit()

    assert first.code != second.code  # extremely high probability

    rows = (await db.execute(select(AuthChallenge))).scalars().all()
    assert len(rows) == 2
    consumed_count = sum(1 for r in rows if r.consumed_at is not None)
    assert consumed_count == 1


async def test_verify_with_correct_code_succeeds(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    res = await verify_challenge(db, email="alice@example.com", code=out.code)
    assert res.ok
    assert res.email == "alice@example.com"

    row = (await db.execute(select(AuthChallenge))).scalar_one()
    assert row.consumed_at is not None


async def test_verify_with_correct_link_token_succeeds(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    res = await verify_challenge(
        db, email="alice@example.com", link_token=out.link_token
    )
    assert res.ok


async def test_verify_with_wrong_code_increments_attempts(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    bad = "999999" if out.code != "999999" else "000000"
    res = await verify_challenge(db, email="alice@example.com", code=bad)
    assert not res.ok

    row = (await db.execute(select(AuthChallenge))).scalar_one()
    assert row.attempts == 1
    assert row.consumed_at is None


async def test_attempts_cap_locks_challenge(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    # Simulate 5 prior wrong attempts directly (faster than 5 calls).
    await db.execute(update(AuthChallenge).values(attempts=5))
    await db.commit()

    # Even with the *correct* code, a maxed-out challenge is now ignored.
    res = await verify_challenge(db, email="alice@example.com", code=out.code)
    assert not res.ok


async def test_link_and_code_share_attempts_counter(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    bad_code = "999999" if out.code != "999999" else "000000"
    bad_link = "A" * 32 if out.link_token != "A" * 32 else "B" * 32

    await verify_challenge(db, email="alice@example.com", code=bad_code)
    await verify_challenge(db, email="alice@example.com", link_token=bad_link)
    await verify_challenge(db, email="alice@example.com", code=bad_code)

    row = (await db.execute(select(AuthChallenge))).scalar_one()
    assert row.attempts == 3


async def test_expired_challenge_rejected(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    # Force the row's expires_at into the past.
    await db.execute(
        update(AuthChallenge).values(
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)
        )
    )
    await db.commit()

    res = await verify_challenge(db, email="alice@example.com", code=out.code)
    assert not res.ok


async def test_consumed_challenge_rejected_on_replay(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    res1 = await verify_challenge(db, email="alice@example.com", code=out.code)
    assert res1.ok
    res2 = await verify_challenge(db, email="alice@example.com", code=out.code)
    assert not res2.ok


async def test_verify_requires_exactly_one_input(db: AsyncSession) -> None:
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    both = await verify_challenge(
        db, email="alice@example.com", code=out.code, link_token=out.link_token
    )
    assert not both.ok

    neither = await verify_challenge(db, email="alice@example.com")
    assert not neither.ok


async def test_invalid_format_inputs_rejected_without_db_lookup(
    db: AsyncSession,
) -> None:
    """Format-invalid code or token short-circuits to ok=False without
    creating any side effects (no attempts increment, no consumption).
    """
    out = await create_challenge(db, email="alice@example.com")
    await db.commit()

    # 5 digits — not a valid 6-digit code.
    res = await verify_challenge(db, email="alice@example.com", code="12345")
    assert not res.ok

    # Lowercase — link tokens are uppercase base32.
    res = await verify_challenge(
        db, email="alice@example.com", link_token="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    )
    assert not res.ok

    row = (await db.execute(select(AuthChallenge))).scalar_one()
    assert row.attempts == 0
    assert row.consumed_at is None
