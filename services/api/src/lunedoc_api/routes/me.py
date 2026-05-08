"""GET /api/v1/me/* — authenticated dashboard endpoints.

Phase 4 Step 2A. Backs the user dashboard with three reads:
  - GET /me/jobs   — paginated list of the user's jobs
  - GET /me/files  — paginated list of the user's non-expired files
  - GET /me/usage  — counts and tier summary

All three require Bearer auth via `auth.deps.get_current_user`.
Responses never include `owner_token_hash` and (for /me/jobs) surface
only the `result_meta` slice of the `params` JSONB blob.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.deps import get_current_user
from ..db import get_session
from ..models.file import File as FileRow
from ..models.job import Job
from ..models.me import (
    MeFileItem,
    MeFilesList,
    MeJobItem,
    MeJobsList,
    MeUsageResponse,
)
from ..models.user import User
from ..quota import get_ocr_pages_used_today

router = APIRouter()

_MAX_LIMIT = 100
_DEFAULT_LIMIT = 20


@router.get(
    "/me/jobs",
    response_model=MeJobsList,
    summary="My jobs (paginated)",
)
async def list_my_jobs(
    limit: int = Query(default=_DEFAULT_LIMIT, ge=1, le=_MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> MeJobsList:
    page = (
        await db.execute(
            select(Job)
            .where(Job.user_id == user.id)
            .order_by(Job.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()
    total = (
        await db.execute(
            select(func.count()).select_from(Job).where(Job.user_id == user.id)
        )
    ).scalar_one()

    items = [
        MeJobItem(
            job_id=row.id,
            tool=row.tool,  # type: ignore[arg-type]
            status=row.status,  # type: ignore[arg-type]
            input_file_ids=list(row.input_file_ids),
            output_file_ids=list(row.output_file_ids),
            error=row.error,
            result_meta=(row.params or {}).get("result_meta"),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in page
    ]
    return MeJobsList(items=items, limit=limit, offset=offset, total=int(total))


@router.get(
    "/me/files",
    response_model=MeFilesList,
    summary="My files (paginated, non-expired only)",
)
async def list_my_files(
    limit: int = Query(default=_DEFAULT_LIMIT, ge=1, le=_MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> MeFilesList:
    now = datetime.now(timezone.utc)
    base_filters = (FileRow.user_id == user.id, FileRow.expires_at > now)

    page = (
        await db.execute(
            select(FileRow)
            .where(*base_filters)
            .order_by(FileRow.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()
    total = (
        await db.execute(
            select(func.count()).select_from(FileRow).where(*base_filters)
        )
    ).scalar_one()

    # Field-by-field projection — never include `owner_token_hash`.
    items = [
        MeFileItem(
            file_id=row.id,
            name=row.name,
            mime=row.mime,
            size=row.size,
            expires_at=row.expires_at,
            created_at=row.created_at,
        )
        for row in page
    ]
    return MeFilesList(items=items, limit=limit, offset=offset, total=int(total))


@router.get(
    "/me/usage",
    response_model=MeUsageResponse,
    summary="My account usage summary",
)
async def my_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> MeUsageResponse:
    now = datetime.now(timezone.utc)

    total_files = int(
        (
            await db.execute(
                select(func.count())
                .select_from(FileRow)
                .where(FileRow.user_id == user.id, FileRow.expires_at > now)
            )
        ).scalar_one()
    )
    total_jobs = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Job)
                .where(Job.user_id == user.id)
            )
        ).scalar_one()
    )

    by_status_rows = (
        await db.execute(
            select(Job.status, func.count())
            .where(Job.user_id == user.id)
            .group_by(Job.status)
        )
    ).all()
    by_tool_rows = (
        await db.execute(
            select(Job.tool, func.count())
            .where(Job.user_id == user.id)
            .group_by(Job.tool)
        )
    ).all()

    return MeUsageResponse(
        tier="free",
        total_files=total_files,
        total_jobs=total_jobs,
        jobs_by_status={s: int(n) for s, n in by_status_rows},
        jobs_by_tool={t: int(n) for t, n in by_tool_rows},
        ocr_pages_used_today=await get_ocr_pages_used_today(f"user:{user.id}"),
    )
