"""POST/GET /api/v1/jobs/* — async tool execution.

Phase 1 ships only the `merge` tool. Other tools still 501 until
their own routes land (Split, Watermark, Sign, ...).

Per docs/backend-api-plan.md §2.2 + §6.4:
- All input files must be owned by the X-Owner-Token (verified row-by-row).
- The job inherits owner_token_hash; output File rows inherit it too.
- Status / result endpoints return 404 on token mismatch — no leak.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.deps import can_access, get_current_user_optional
from ..db import get_session
from ..models.file import File as FileRow
from ..models.job import (
    OCR_FREE_PAGE_CAP,
    CompressJobRequest,
    ConvertJobRequest,
    EditJobRequest,
    Job,
    JobResultResponse,
    JobStatusResponse,
    MergeJobRequest,
    OcrJobRequest,
    ResultFile,
    SignJobRequest,
    SplitJobRequest,
    WatermarkJobRequest,
)
from ..models.user import User
from ..owner_token import hash_token
from ..quota import (
    decrement_active_jobs,
    enforce_concurrent_jobs,
    enforce_jobs_per_hour,
    enforce_ocr_pages,
    identity_for_user,
    increment_active_jobs,
    record_job_creation,
)
from ..storage import get_storage

router = APIRouter()


def _job_to_status(job: Job) -> JobStatusResponse:
    return JobStatusResponse(
        job_id=job.id,
        tool=job.tool,  # type: ignore[arg-type]
        status=job.status,  # type: ignore[arg-type]
        input_file_ids=list(job.input_file_ids),
        output_file_ids=list(job.output_file_ids),
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


async def _reserve_quota_slot(identity: str) -> None:
    """Increment the active-jobs counter and bump the jobs/hour counter.

    Called after enforcement passes and the job row has been created,
    immediately before `task.delay(...)`. The caller is responsible
    for `decrement_active_jobs(identity)` if the enqueue itself fails.
    """
    await increment_active_jobs(identity)
    await record_job_creation(identity)


async def _load_owned_job(
    job_id: str,
    *,
    user: User | None,
    owner_token: str | None,
    db: AsyncSession,
) -> Job:
    """Load a Job by id, verify caller owns it, return it.

    Ownership: claimed (user_id set) → only the owning user; anonymous
    (user_id NULL) → owner_token must match. 404 either way.
    """
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None or not can_access(job, user=user, owner_token=owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    return job


@router.post(
    "/jobs/merge",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary="Create a merge job",
)
async def create_merge_job(
    body: MergeJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    # Verify caller owns every input file. Use 404 (not 403) to match the
    # rest of the API's no-leak policy.
    for fid in body.file_ids:
        f = (
            await db.execute(select(FileRow).where(FileRow.id == fid))
        ).scalar_one_or_none()
        if f is None or not can_access(f, user=user, owner_token=x_owner_token):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="not found"
            )
        if f.mime != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"file {fid} is not a PDF",
            )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    job = Job(
        id=job_id,
        tool="merge",
        status="queued",
        input_file_ids=list(body.file_ids),
        output_file_ids=[],
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Reserve a concurrent-jobs slot, then enqueue. In tests
    # CELERY_TASK_ALWAYS_EAGER=1 so .delay() runs in-process and the
    # worker decrements before returning.
    await _reserve_quota_slot(identity)
    from ..workers.tasks.merge import run_merge_job

    try:
        run_merge_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    # Re-read in case the eager task already finished.
    await db.refresh(job)
    return _job_to_status(job)


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job status",
)
async def get_job(
    job_id: str,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    job = await _load_owned_job(job_id, user=user, owner_token=x_owner_token, db=db)
    return _job_to_status(job)


@router.get(
    "/jobs/{job_id}/result",
    response_model=JobResultResponse,
    summary="Get job result (download metadata)",
)
async def get_job_result(
    job_id: str,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobResultResponse:
    job = await _load_owned_job(job_id, user=user, owner_token=x_owner_token, db=db)

    if job.status == "queued" or job.status == "running":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"job not finished (status={job.status})",
        )
    if job.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=job.error or "job failed",
        )

    # status == "done"
    outputs: list[ResultFile] = []
    for fid in job.output_file_ids:
        f = (
            await db.execute(select(FileRow).where(FileRow.id == fid))
        ).scalar_one_or_none()
        if f is None:
            # Output row got swept (TTL hit) between done and result fetch.
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="result file expired",
            )
        outputs.append(
            ResultFile(
                file_id=f.id,
                name=f.name,
                mime=f.mime,
                size=f.size,
                expires_at=f.expires_at,
                download_url=f"/api/v1/files/{f.id}/download",
            )
        )

    return JobResultResponse(
        job_id=job.id,
        tool=job.tool,  # type: ignore[arg-type]
        status=job.status,  # type: ignore[arg-type]
        outputs=outputs,
    )


@router.post(
    "/jobs/split",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary="Create a split job",
)
async def create_split_job(
    body: SplitJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    if body.mode == "ranges" and not body.ranges:
        # Pydantic validator already rejects empty/None for `mode='ranges'`,
        # but defend in depth.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ranges required when mode='ranges'",
        )

    # Verify caller owns the input file. Same no-leak policy: 404 on
    # missing-row or wrong-token, 415 on non-PDF.
    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    params: dict = {"mode": body.mode}
    if body.mode == "ranges":
        params["ranges"] = body.ranges

    job = Job(
        id=job_id,
        tool="split",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params=params,
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.split import run_split_job

    try:
        run_split_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)


@router.post(
    "/jobs/watermark",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary="Create a watermark job",
)
async def create_watermark_job(
    body: WatermarkJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    params: dict = {
        "text": body.text,
        "position": body.position,
        "opacity": body.opacity,
        "rotation": body.rotation,
    }

    job = Job(
        id=job_id,
        tool="watermark",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params=params,
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.watermark import run_watermark_job

    try:
        run_watermark_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)


@router.post(
    "/jobs/sign",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary=(
        "Create a sign job (visible signature only — NOT a "
        "cryptographic e-signature)"
    ),
)
async def create_sign_job(
    body: SignJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    params: dict = {
        "mode": body.mode,
        "page": body.page,
        "x": body.x,
        "y": body.y,
        "width": body.width,
    }
    if body.text is not None:
        params["text"] = body.text
    if body.image_data is not None:
        params["image_data"] = body.image_data

    job = Job(
        id=job_id,
        tool="sign",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params=params,
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.sign import run_sign_job

    try:
        run_sign_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)


@router.post(
    "/jobs/edit",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary=(
        "Create an edit job (overlay / redact editing only — "
        "NOT Acrobat-style content reflow)"
    ),
)
async def create_edit_job(
    body: EditJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    # Operations serialize to plain dicts via model_dump; the engine
    # accepts the discriminator + per-op fields by name.
    params: dict = {
        "operations": [op.model_dump() for op in body.operations],
    }

    job = Job(
        id=job_id,
        tool="edit",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params=params,
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.edit import run_edit_job

    try:
        run_edit_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)


@router.post(
    "/jobs/compress",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary="Create a compress job (Ghostscript with PyMuPDF fallback)",
)
async def create_compress_job(
    body: CompressJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    job = Job(
        id=job_id,
        tool="compress",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params={"level": body.level},
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.compress import run_compress_job

    try:
        run_compress_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)


_FORMAT_TO_MIME: dict[str, str] = {
    "PDF": "application/pdf",
    "JPG": "image/jpeg",
    "PNG": "image/png",
    "DOCX": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "XLSX": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "PPTX": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


@router.post(
    "/jobs/convert",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary="Create a convert job (PyMuPDF + LibreOffice)",
)
async def create_convert_job(
    body: ConvertJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    expected_mime = _FORMAT_TO_MIME[body.from_format]
    if f.mime != expected_mime:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"file {body.file_id} mime {f.mime!r} does not match "
                f"from_format={body.from_format} (expected {expected_mime})"
            ),
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    job = Job(
        id=job_id,
        tool="convert",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params={
            "from_format": body.from_format,
            "to_format": body.to_format,
            "image_dpi": body.image_dpi,
        },
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.convert import run_convert_job

    try:
        run_convert_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)


@router.post(
    "/jobs/ocr",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobStatusResponse,
    summary="Create an OCR job (Tesseract — extract or searchable PDF)",
)
async def create_ocr_job(
    body: OcrJobRequest,
    x_owner_token: str | None = Header(default=None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not can_access(f, user=user, owner_token=x_owner_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

    # Page-cap fast-fail at the route layer. Opening the PDF is fast
    # (~1 ms typical); the alternative is enqueueing a job that the
    # engine would reject anyway.
    import pymupdf  # local import keeps the route module light

    storage = get_storage()
    input_path = storage._path_for(f.storage_key)
    try:
        probe = pymupdf.open(input_path)
        try:
            page_count = probe.page_count
        finally:
            probe.close()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} could not be opened as a PDF",
        )

    if page_count > OCR_FREE_PAGE_CAP:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"OCR free tier capped at {OCR_FREE_PAGE_CAP} pages; "
                f"this PDF has {page_count}"
            ),
        )

    identity = identity_for_user(user, x_owner_token)
    await enforce_jobs_per_hour(identity)
    await enforce_concurrent_jobs(identity)
    # Stronger pre-check: reject if the job would push us past the
    # daily OCR-page limit. Worker-side `record_ocr_pages_sync` after
    # success is the source of truth.
    await enforce_ocr_pages(identity, additional_pages=page_count)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    job = Job(
        id=job_id,
        tool="ocr",
        status="queued",
        input_file_ids=[body.file_id],
        output_file_ids=[],
        params={"mode": body.mode, "lang": body.lang},
        error=None,
        owner_token_hash=hash_token(x_owner_token),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await _reserve_quota_slot(identity)
    from ..workers.tasks.ocr import run_ocr_job

    try:
        run_ocr_job.delay(job_id)
    except Exception:
        await decrement_active_jobs(identity)
        raise

    await db.refresh(job)
    return _job_to_status(job)
