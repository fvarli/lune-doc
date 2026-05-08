"""Pydantic Settings — env-driven configuration.

Reads `.env` (gitignored). All defaults match `.env.example`.
"""
from __future__ import annotations

from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    REDIS_URL: str = "redis://localhost:6379/0"

    STORAGE_ROOT: Path = Path(".local-storage")

    OWNER_TOKEN_PEPPER: str

    MAX_UPLOAD_BYTES: int = 50 * 1024 * 1024
    FILE_TTL_SECONDS: int = 3600

    # --- Phase 4 — auth ---
    # Mandatory secrets (no default). Generate with:
    #   python -c "import secrets; print(secrets.token_urlsafe(32))"
    # JWT signing key (network-presented) and challenge HMAC pepper
    # (data-at-rest hash) are intentionally separate keys: different
    # blast radii — rotating JWT must not invalidate live email
    # challenges, and vice versa.
    JWT_SECRET: str
    AUTH_CHALLENGE_PEPPER: str

    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_TTL_SECONDS: int = 900                  # 15 min
    REFRESH_TOKEN_TTL_SECONDS: int = 60 * 60 * 24 * 30   # 30 days

    EMAIL_CHALLENGE_TTL_SECONDS: int = 900               # 15 min
    EMAIL_CHALLENGE_MAX_ATTEMPTS: int = 5

    EMAIL_BACKEND: Literal["console"] = "console"
    EMAIL_FROM: str = "no-reply@lunedoc.local"
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    EMAIL_START_RATE_PER_EMAIL_PER_HOUR: int = 5
    EMAIL_START_RATE_PER_IP_PER_HOUR: int = 20

    # NoDecode disables pydantic-settings' default JSON parse for list/dict
    # fields so the validator below can accept comma-separated env values.
    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(default_factory=list)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, v: object) -> object:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("["):  # already JSON
                import json
                return json.loads(v)
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


_settings: Settings | None = None


def get_settings() -> Settings:
    """Cached accessor."""
    global _settings
    if _settings is None:
        _settings = Settings()  # type: ignore[call-arg]
    return _settings
