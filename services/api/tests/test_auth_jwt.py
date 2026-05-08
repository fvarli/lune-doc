"""JWT module — encode/decode round-trip + failure modes."""
from __future__ import annotations

import time

import jwt as pyjwt
import pytest

from lunedoc_api.auth.jwt import (
    AccessClaims,
    InvalidToken,
    decode_access_token,
    encode_access_token,
)
from lunedoc_api.settings import get_settings


def test_encode_decode_round_trip_returns_claims() -> None:
    token = encode_access_token(sub="user-1", rt_id="rt-1", jti="jti-1")
    claims = decode_access_token(token)
    assert isinstance(claims, AccessClaims)
    assert claims.sub == "user-1"
    assert claims.rt_id == "rt-1"
    assert claims.jti == "jti-1"
    assert claims.exp > claims.iat


def test_expired_access_token_rejected() -> None:
    token = encode_access_token(sub="u", rt_id="r", jti="j", ttl_seconds=-1)
    # Leeway is 10s by default; force a stricter check by passing 0.
    # Even so, ttl=-1 puts exp 1s in the past, which exceeds 0 leeway
    # only by 1s — set ttl=-30 to comfortably exceed both 0 and 10s.
    token = encode_access_token(sub="u", rt_id="r", jti="j", ttl_seconds=-30)
    with pytest.raises(InvalidToken):
        decode_access_token(token)


def test_bad_signature_rejected() -> None:
    settings = get_settings()
    forged = pyjwt.encode(
        {"sub": "u", "rt_id": "r", "jti": "j", "iat": int(time.time()), "exp": int(time.time()) + 60},
        "wrong-secret",
        algorithm=settings.JWT_ALGORITHM,
    )
    with pytest.raises(InvalidToken):
        decode_access_token(forged)


def test_malformed_token_rejected() -> None:
    with pytest.raises(InvalidToken):
        decode_access_token("not.a.jwt")
    with pytest.raises(InvalidToken):
        decode_access_token("")


def test_missing_required_claim_rejected() -> None:
    settings = get_settings()
    incomplete = pyjwt.encode(
        # No `rt_id` — required by AccessClaims.
        {"sub": "u", "jti": "j", "iat": int(time.time()), "exp": int(time.time()) + 60},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    with pytest.raises(InvalidToken):
        decode_access_token(incomplete)


def test_decoder_accepts_token_with_unknown_extra_claim() -> None:
    """Forward-compat: extra claims don't reject the token."""
    settings = get_settings()
    token = pyjwt.encode(
        {
            "sub": "u",
            "rt_id": "r",
            "jti": "j",
            "iat": int(time.time()),
            "exp": int(time.time()) + 60,
            "future_field": "hello",
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    claims = decode_access_token(token)
    assert claims.sub == "u"
