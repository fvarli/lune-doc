"""Settings — mandatory secrets fail loud; defaults apply otherwise.

Phase 4 added two new mandatory secrets (`JWT_SECRET`,
`AUTH_CHALLENGE_PEPPER`) parallel to the existing `OWNER_TOKEN_PEPPER`.
None of them have defaults — missing any is a startup error, not a
"silently use a weak default" trap.
"""
from __future__ import annotations

import pytest
from pydantic import ValidationError


def _required_env() -> dict[str, str]:
    """Minimum env to construct Settings successfully."""
    return {
        "DATABASE_URL": "postgresql+asyncpg://x:y@localhost:5432/z",
        "DATABASE_URL_SYNC": "postgresql+psycopg2://x:y@localhost:5432/z",
        "OWNER_TOKEN_PEPPER": "x",
        "JWT_SECRET": "x",
        "AUTH_CHALLENGE_PEPPER": "x",
    }


def _apply(monkeypatch, env: dict[str, str], drop: str | None = None) -> None:
    if drop:
        env = {k: v for k, v in env.items() if k != drop}
    # Clear every key first so a developer's shell env can't leak in.
    for key in _required_env().keys():
        monkeypatch.delenv(key, raising=False)
    for k, v in env.items():
        monkeypatch.setenv(k, v)


def test_missing_jwt_secret_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    from lunedoc_api.settings import Settings

    _apply(monkeypatch, _required_env(), drop="JWT_SECRET")
    with pytest.raises(ValidationError):
        # _env_file=None disables .env loading so a local file can't
        # mask the missing var.
        Settings(_env_file=None)  # type: ignore[call-arg]


def test_missing_auth_challenge_pepper_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    from lunedoc_api.settings import Settings

    _apply(monkeypatch, _required_env(), drop="AUTH_CHALLENGE_PEPPER")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)  # type: ignore[call-arg]


def test_defaults_apply_when_required_secrets_present(monkeypatch: pytest.MonkeyPatch) -> None:
    from lunedoc_api.settings import Settings

    _apply(monkeypatch, _required_env())
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    assert s.JWT_ALGORITHM == "HS256"
    assert s.ACCESS_TOKEN_TTL_SECONDS == 900
    assert s.REFRESH_TOKEN_TTL_SECONDS == 60 * 60 * 24 * 30
    assert s.EMAIL_CHALLENGE_TTL_SECONDS == 900
    assert s.EMAIL_CHALLENGE_MAX_ATTEMPTS == 5
    assert s.EMAIL_BACKEND == "console"
    assert s.EMAIL_FROM == "no-reply@lunedoc.local"
    assert s.FRONTEND_BASE_URL == "http://localhost:5173"
    assert s.EMAIL_START_RATE_PER_EMAIL_PER_HOUR == 5
    assert s.EMAIL_START_RATE_PER_IP_PER_HOUR == 20
