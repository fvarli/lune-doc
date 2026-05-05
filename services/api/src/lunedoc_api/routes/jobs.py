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

from ..db import get_session
from ..models.file import File as FileRow
from ..models.job import (
    CompressJobRequest,
    ConvertJobRequest,
    EditJobRequest,
    Job,
    JobResultResponse,
    JobStatusResponse,
    MergeJobRequest,
    ResultFile,
    SignJobRequest,
    SplitJobRequest,
    WatermarkJobRequest,
)
from ..owner_token import hash_token, verify

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


async def _load_owned_job(
    job_id: str,
    token: str | None,
    db: AsyncSession,
) -> Job:
    """Load a Job by id, verify owner_token, return it.

    404 on either missing-row or token-mismatch (no existence leak).
    """
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None or not verify(token, job.owner_token_hash):
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
        if f is None or not verify(x_owner_token, f.owner_token_hash):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="not found"
            )
        if f.mime != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"file {fid} is not a PDF",
            )

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

    # Enqueue. In tests CELERY_TASK_ALWAYS_EAGER=1 so this runs in-process.
    from ..workers.tasks.merge import run_merge_job

    run_merge_job.delay(job_id)

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
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    job = await _load_owned_job(job_id, x_owner_token, db)
    return _job_to_status(job)


@router.get(
    "/jobs/{job_id}/result",
    response_model=JobResultResponse,
    summary="Get job result (download metadata)",
)
async def get_job_result(
    job_id: str,
    x_owner_token: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> JobResultResponse:
    job = await _load_owned_job(job_id, x_owner_token, db)

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
    if f is None or not verify(x_owner_token, f.owner_token_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

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

    from ..workers.tasks.split import run_split_job

    run_split_job.delay(job_id)

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
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not verify(x_owner_token, f.owner_token_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

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

    from ..workers.tasks.watermark import run_watermark_job

    run_watermark_job.delay(job_id)

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
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not verify(x_owner_token, f.owner_token_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

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

    from ..workers.tasks.sign import run_sign_job

    run_sign_job.delay(job_id)

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
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not verify(x_owner_token, f.owner_token_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

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

    from ..workers.tasks.edit import run_edit_job

    run_edit_job.delay(job_id)

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
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not verify(x_owner_token, f.owner_token_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if f.mime != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"file {body.file_id} is not a PDF",
        )

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

    from ..workers.tasks.compress import run_compress_job

    run_compress_job.delay(job_id)

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
    db: AsyncSession = Depends(get_session),
) -> JobStatusResponse:
    if not x_owner_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    f = (
        await db.execute(select(FileRow).where(FileRow.id == body.file_id))
    ).scalar_one_or_none()
    if f is None or not verify(x_owner_token, f.owner_token_hash):
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

    from ..workers.tasks.convert import run_convert_job

    run_convert_job.delay(job_id)

    await db.refresh(job)
    return _job_to_status(job)


# Tools that still 501 until they land.
@router.post("/jobs/ocr", summary="Create an OCR job (Phase 3)")
async def _other_tools_not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="tool endpoint not yet implemented",
    )
