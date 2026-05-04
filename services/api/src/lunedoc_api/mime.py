"""MIME sniffing + whitelist gate.

Sniffs file content via libmagic. Never trusts the client-supplied
`Content-Type`. Only allows the document/image types we'll process.
"""
from __future__ import annotations

import magic

# Per docs/backend-api-plan.md §6.1
WHITELIST: frozenset[str] = frozenset(
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/tiff",
        "image/webp",
        # Office formats
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }
)


def sniff_bytes(data: bytes) -> str:
    """Read the magic bytes of `data` (first ~2KB is enough)."""
    return magic.from_buffer(data, mime=True)


def is_allowed(mime_type: str) -> bool:
    return mime_type in WHITELIST
