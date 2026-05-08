"""Add nullable user_id columns to files and jobs.

Phase 4 Step 1, second migration. Lets the existing anonymous-only
flow continue (rows where user_id IS NULL keep working via owner_token)
while authenticated users' files/jobs are linked to their account by
the claim endpoint.

ON DELETE SET NULL: account deletion doesn't drop file/job rows; the
storage sweeper (TTL-based) is the canonical owner of disk lifecycle.

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-08
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "files",
        sa.Column("user_id", sa.String(length=36), nullable=True),
    )
    op.create_foreign_key(
        "fk_files_user_id",
        "files",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_files_user_id_created_at",
        "files",
        ["user_id", sa.text("created_at DESC")],
    )

    op.add_column(
        "jobs",
        sa.Column("user_id", sa.String(length=36), nullable=True),
    )
    op.create_foreign_key(
        "fk_jobs_user_id",
        "jobs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_jobs_user_id_created_at",
        "jobs",
        ["user_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("ix_jobs_user_id_created_at", table_name="jobs")
    op.drop_constraint("fk_jobs_user_id", "jobs", type_="foreignkey")
    op.drop_column("jobs", "user_id")
    op.drop_index("ix_files_user_id_created_at", table_name="files")
    op.drop_constraint("fk_files_user_id", "files", type_="foreignkey")
    op.drop_column("files", "user_id")
