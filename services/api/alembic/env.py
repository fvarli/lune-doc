"""Alembic environment — uses the sync DATABASE_URL_SYNC for migrations.

Async engines (asyncpg) work fine for the runtime app but Alembic's
migration runner is synchronous; we read the same Postgres database
through psycopg2 here.

Pass `-x db=test` to apply against the test database.
"""
from __future__ import annotations

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make the package importable from the migration scripts.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

# Load .env so DATABASE_URL_SYNC is available without manual export.
try:
    from dotenv import load_dotenv  # type: ignore[import-not-found]
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except ImportError:
    # python-dotenv is not a hard dep; pydantic-settings handles .env at runtime.
    # For migrations, allow missing .env — env vars must already be set.
    pass

from lunedoc_api.models.file import Base  # noqa: E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _resolve_database_url() -> str:
    """Pick test or dev DB based on `-x db=test` flag.

    For the test branch we accept either DATABASE_URL_SYNC_TEST (full
    override) or derive it from DATABASE_URL_SYNC by swapping only the
    trailing `/lunedoc_dev` path component — the password may legitimately
    contain the substring `lunedoc_dev` so a global string replace is unsafe.
    """
    from urllib.parse import urlsplit, urlunsplit

    x_args = context.get_x_argument(as_dictionary=True)
    if x_args.get("db") == "test":
        url = os.environ.get("DATABASE_URL_SYNC_TEST")
        if not url:
            base = os.environ.get("DATABASE_URL_SYNC", "")
            if not base:
                raise RuntimeError(
                    "DATABASE_URL_SYNC_TEST or DATABASE_URL_SYNC must be set"
                )
            parts = urlsplit(base)
            if parts.path != "/lunedoc_dev":
                raise RuntimeError(
                    "Cannot derive test DB URL from DATABASE_URL_SYNC: set "
                    "DATABASE_URL_SYNC_TEST explicitly"
                )
            url = urlunsplit(parts._replace(path="/lunedoc_test"))
        return url

    url = os.environ.get("DATABASE_URL_SYNC")
    if not url:
        raise RuntimeError("DATABASE_URL_SYNC must be set in .env or environment")
    return url


def run_migrations_offline() -> None:
    context.configure(
        url=_resolve_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section) or {}
    cfg["sqlalchemy.url"] = _resolve_database_url()
    connectable = engine_from_config(cfg, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
