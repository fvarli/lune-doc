"""Storage abstraction.

Phase 0 ships a single `LocalDiskStorage` impl. R2 / S3 land later behind
the same Protocol — call sites don't change.
"""
from __future__ import annotations

import shutil
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Protocol


@dataclass
class StorageStat:
    size: int


class Storage(Protocol):
    async def write(self, key: str, stream: BinaryIO, *, max_bytes: int) -> StorageStat: ...
    def read_iter(self, key: str, *, chunk_size: int = 64 * 1024) -> Iterator[bytes]: ...
    def delete_sync(self, key: str) -> bool: ...
    async def exists(self, key: str) -> bool: ...
    async def stat(self, key: str) -> StorageStat | None: ...


class TooLargeError(Exception):
    """Raised when a stream exceeds max_bytes during write."""


class LocalDiskStorage:
    """Stores objects under `<root>/<key[:2]>/<key>`.

    The two-char prefix shard keeps directory listings sane at scale.
    """

    def __init__(self, root: Path):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path_for(self, key: str) -> Path:
        return self.root / key[:2] / key

    async def write(self, key: str, stream: BinaryIO, *, max_bytes: int) -> StorageStat:
        path = self._path_for(key)
        path.parent.mkdir(parents=True, exist_ok=True)

        size = 0
        # Write in chunks; abort if size exceeds max_bytes.
        with path.open("wb") as out:
            while True:
                chunk = stream.read(64 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    out.close()
                    path.unlink(missing_ok=True)
                    raise TooLargeError(f"stream exceeded {max_bytes} bytes")
                out.write(chunk)

        return StorageStat(size=size)

    def read_iter(self, key: str, *, chunk_size: int = 64 * 1024) -> Iterator[bytes]:
        path = self._path_for(key)
        with path.open("rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    def delete_sync(self, key: str) -> bool:
        path = self._path_for(key)
        if path.exists():
            path.unlink()
            # Best-effort cleanup of the shard dir if empty.
            try:
                path.parent.rmdir()
            except OSError:
                pass
            return True
        return False

    async def exists(self, key: str) -> bool:
        return self._path_for(key).exists()

    async def stat(self, key: str) -> StorageStat | None:
        path = self._path_for(key)
        if not path.exists():
            return None
        return StorageStat(size=path.stat().st_size)


# Helpers for tests / dev wipe.
def wipe_root(root: Path) -> None:
    """Remove every file under `root`. Use only in tests / dev."""
    if root.exists():
        shutil.rmtree(root)
        root.mkdir(parents=True, exist_ok=True)


_default: LocalDiskStorage | None = None


def get_storage() -> LocalDiskStorage:
    """Cached accessor that resolves STORAGE_ROOT relative to the
    `services/api/` directory (the project root for this service)."""
    global _default
    if _default is None:
        from .settings import get_settings

        root = get_settings().STORAGE_ROOT
        if not root.is_absolute():
            # services/api/.local-storage by default
            root = (Path(__file__).resolve().parents[2] / root).resolve()
        _default = LocalDiskStorage(root)
    return _default
