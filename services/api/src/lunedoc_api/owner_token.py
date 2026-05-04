"""Owner-token generation, hashing, and verification.

Anonymous users prove ownership by echoing the `owner_token` returned
at upload. The server only stores its HMAC-SHA256 hash, peppered with
`OWNER_TOKEN_PEPPER` from settings.

Constant-time compare on verification.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets

from .settings import get_settings


def generate() -> str:
    """32-character base32 (no padding). 160 bits of entropy."""
    raw = secrets.token_bytes(20)
    return base64.b32encode(raw).decode("ascii").rstrip("=")


def hash_token(token: str) -> str:
    pepper = get_settings().OWNER_TOKEN_PEPPER.encode("utf-8")
    digest = hmac.new(pepper, token.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest


def verify(token: str | None, stored_hash: str) -> bool:
    if not token:
        return False
    computed = hash_token(token)
    return hmac.compare_digest(computed, stored_hash)
