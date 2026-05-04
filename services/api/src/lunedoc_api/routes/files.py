"""POST/GET/DELETE /api/v1/files — anonymous file lifecycle.

Phase 0 endpoints (the real implementation, not stubs).

Per docs/backend-api-plan.md §2.1, §6.1, §6.4:
- owner_token returned at upload, required on subsequent ops
- DELETE returns 204 unconditionally (no existence leak)
- GET / download return 404 for missing OR token mismatch (no existence leak)
- MIME whitelist via libmagic; reject with 415
- Size cap MAX_UPLOAD_BYTES; reject with 413
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..mime import is_allowed, sniff_bytes
from ..models.file import File as FileRow, FileMetadata, UploadResponse
from ..owner_token import generate as generate_token
from ..owner_token import hash_token, is_valid_format, verify
from ..settings import get_settings
from ..storage import TooLargeError, get_storage

router = APIRouter()

_FILENAME_BAD_CHARS = re.compile(r"[^\w.\- ]+")


def _sanitize_filename(raw: str | None) -> str:
    """Display-only filename. Strip path, keep alnum/dot/dash/underscore/space."""
    if not raw:
        return "file"
    base = raw.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    cleaned = _FILENAME_BAD_CHARS.sub("_", base).strip(" ._-")
    return cleaned or "file"


@router.post(
    "/files",
    status_code=status.HTTP_201_CREATED,
    response_model=UploadResponse,
    summary="Upload one file",
)
async def upload_file(
    file: UploadFile = File(...),
    x_owner_token: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> UploadResponse:
    """Upload a single file.

    If the request carries `X-Owner-Token` and the value matches the
    32-char base32 format produced by `owner_token.generate()`, the new
    file inherits that token's hash — so multiple uploads in one user
    session can share a single token (needed by Merge / Split flows
    that take more than one input file).

    If the header is absent or malformed, a fresh token is minted.
    """
    settings = get_settings()
    storage = get_storage()

    # Sniff first 2 KB for MIME (read-and-rewind).
    head = await file.read(2048)
    if not head:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="empty upload"
        )

    mime = sniff_bytes(head)
    if not is_allowed(mime):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"mime type not allowed: {mime}",
        )

    # Reset file pointer; SpooledTemporaryFile-backed UploadFile supports seek.
    await file.seek(0)

    file_id = str(uuid.uuid4())
    storage_key = file_id  # 1:1 in Phase 0; sharded by storage layer.
    if x_owner_token and is_valid_format(x_owner_token):
        token = x_owner_token
    else:
        token = generate_token()

    try:
        # UploadFile.file is the underlying SpooledTemporaryFile (sync).
        stat = await storage.write(
            storage_key, file.file, max_bytes=settings.MAX_UPLOAD_BYTES
        )
    except TooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(exc),
        )

    name = _sanitize_filename(file.filename)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=settings.FILE_TTL_SECONDS)

    row = FileRow(
        id=file_id,
        name=name,
        mime=mime,
        size=stat.size,
        storage_key=storage_key,
        owner_token_hash=hash_token(token),
        status="uploaded",
        created_at=now,
        expires_at=expires_at,
    )
    db.add(row)
    await db.commit()

    return UploadResponse(
        file_id=file_id,
        owner_token=token,
        name=name,
        mime=mime,
        size=stat.size,
        expires_at=expires_at,
    )


async def _load_owned(
    file_id: str,
    token: str | None,
    db: AsyncSession,
) -> FileRow:
    """Load a file by id, verify owner_token, return the row.

    Raises 404 on either missing-row or token-mismatch — same response either way.
    """
    result = await db.execute(select(FileRow).where(FileRow.id == file_id))
    row = result.scalar_one_or_none()
    if row is None or not verify(token, row.owner_token_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    return row


@router.get(
    "/files/{file_id}",
    response_model=FileMetadata,
    summary="Get file metadata",
)
async def get_file_metadata(
    file_id: str,
    x_owner_token: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> FileMetadata:
    row = await _load_owned(file_id, x_owner_token, db)
    return FileMetadata(
        file_id=row.id,
        name=row.name,
        mime=row.mime,
        size=row.size,
        status=row.status,  # type: ignore[arg-type]
        expires_at=row.expires_at,
    )


@router.get("/files/{file_id}/download", summary="Stream file bytes")
async def download_file(
    file_id: str,
    x_owner_token: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    row = await _load_owned(file_id, x_owner_token, db)
    storage = get_storage()

    if not await storage.exists(row.storage_key):
        # DB row exists but the bytes are gone (e.g. swept mid-request).
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")

    headers = {
        "Content-Disposition": f'attachment; filename="{row.name}"',
        "Content-Length": str(row.size),
    }
    return StreamingResponse(
        storage.read_iter(row.storage_key),
        media_type=row.mime,
        headers=headers,
    )


@router.delete(
    "/files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file (idempotent)",
)
async def delete_file(
    file_id: str,
    x_owner_token: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> None:
    """Idempotent. Always 204, regardless of existence or token validity.

    Per docs/backend-api-plan.md §6.4: don't leak existence on DELETE.
    """
    result = await db.execute(select(FileRow).where(FileRow.id == file_id))
    row = result.scalar_one_or_none()
    if row is None or not verify(x_owner_token, row.owner_token_hash):
        return  # silently no-op

    storage = get_storage()
    storage.delete_sync(row.storage_key)
    await db.delete(row)
    await db.commit()
