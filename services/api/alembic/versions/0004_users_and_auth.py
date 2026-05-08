"""Auth foundations — users, auth_challenges, refresh_tokens.

Phase 4 Step 1. Adds the three tables backing email-passwordless
sign-in. Independent of existing tables; the user_id columns linking
files/jobs to users land in 0005.

Email columns use Postgres `citext` so case-only differences in user
input ("Foo@x.com" vs "foo@x.com") collapse at the DB layer rather
than via brittle application-level lowercasing. Requires the citext
extension; created idempotently here.

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-08
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.types import UserDefinedType


revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


class _Citext(UserDefinedType):
    """Minimal SQLAlchemy type that emits `CITEXT` in DDL.

    Inlined in the migration so the file remains self-contained — old
    revisions of this migration must keep applying even after the ORM
    layer evolves.
    """

    cache_ok = True

    def get_col_spec(self, **_kw: object) -> str:
        return "CITEXT"


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", _Citext(), nullable=False, unique=True),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("disabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "auth_challenges",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", _Citext(), nullable=False),
        sa.Column("purpose", sa.String(length=16), nullable=False),
        sa.Column("code_hash", sa.String(length=128), nullable=False),
        sa.Column("link_token_hash", sa.String(length=128), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("request_ip", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_auth_challenges_email_purpose_expires",
        "auth_challenges",
        ["email", "purpose", sa.text("expires_at DESC")],
    )
    op.create_index(
        "ix_auth_challenges_expires_at",
        "auth_challenges",
        ["expires_at"],
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=128), nullable=False, unique=True),
        sa.Column(
            "parent_id",
            sa.String(length=36),
            sa.ForeignKey("refresh_tokens.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "replaced_by_id",
            sa.String(length=36),
            sa.ForeignKey("refresh_tokens.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_agent", sa.String(length=256), nullable=True),
        sa.Column("ip", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "ix_refresh_tokens_user_revoked",
        "refresh_tokens",
        ["user_id", "revoked_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_user_revoked", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_auth_challenges_expires_at", table_name="auth_challenges")
    op.drop_index(
        "ix_auth_challenges_email_purpose_expires", table_name="auth_challenges"
    )
    op.drop_table("auth_challenges")
    op.drop_table("users")
    # Leave citext extension installed — other consumers may rely on it.
