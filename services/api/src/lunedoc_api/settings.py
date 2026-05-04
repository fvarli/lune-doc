"""Pydantic Settings — env-driven configuration.

Reads `.env` (gitignored). All defaults match `.env.example`.
"""
from __future__ import annotations

from pathlib import Path
from typing import Annotated

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
