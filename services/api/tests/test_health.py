"""Healthcheck reports DB + Redis status."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_healthz_returns_ok_or_degraded(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/healthz")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] in {"ok", "degraded"}
    assert body["version"]
    assert body["db"] in {"ok", "unreachable"}
    assert body["redis"] in {"ok", "unreachable"}
