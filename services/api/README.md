# `@lunedoc/api`

Backend MVP for Lunedoc. **Phase 0 scope:** anonymous file lifecycle (upload, fetch metadata, download, delete), TTL sweeper, healthcheck. Tool endpoints (`/jobs/*`) ship in Phase 1.

**Stack:**
- Python 3.12+ + FastAPI (async)
- PostgreSQL (local install — no Docker)
- Redis + Celery (worker + beat)
- LocalDiskStorage behind a Storage Protocol (R2 swap is a Phase 5 env-only flip)
- `uv` for dependency management

**Not used in Phase 0 / decisions:**
- ❌ Docker — services run directly on the local host, per `docs/backend-api-plan.md` and the team's "no Docker for now" decision.
- ❌ SQLite — Postgres from day one for prod parity.
- ❌ Auth — anonymous flow with `owner_token` (the auth surface is stub-only at `/api/v1/auth/*`).

---

## One-time setup (Xubuntu / Ubuntu)

### 1. System packages

```bash
sudo apt update
sudo apt install -y postgresql redis-server libmagic1
```

`libmagic1` is required by `python-magic` for MIME sniffing.

### 2. Postgres role + database

By default Ubuntu's Postgres uses peer auth on the local socket — only the `postgres` OS user can connect without a password. Create a project-specific role + DB:

```bash
sudo -u postgres psql <<SQL
CREATE ROLE lunedoc WITH LOGIN PASSWORD 'lunedoc_dev_password';
CREATE DATABASE lunedoc_dev OWNER lunedoc;
CREATE DATABASE lunedoc_test OWNER lunedoc;
SQL
```

Verify:

```bash
PGPASSWORD=lunedoc_dev_password psql -h localhost -U lunedoc -d lunedoc_dev -c '\conninfo'
```

If you used a different password, update `DATABASE_URL` and `DATABASE_URL_SYNC` in `.env`.

### 3. Redis

The `redis-server` package starts a daemon on `localhost:6379` automatically. Verify:

```bash
redis-cli ping   # → PONG
```

### 4. Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv --version
```

---

## Project setup

```bash
cd services/api
cp .env.example .env
# edit .env to match your Postgres password
# generate the HMAC pepper:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# paste it as OWNER_TOKEN_PEPPER in .env

uv sync                              # creates .venv + uv.lock
uv run alembic upgrade head          # applies the initial migration
```

---

## Run locally

Open three terminals from `services/api/`:

```bash
# Terminal 1 — API
uv run uvicorn lunedoc_api.main:app --reload --port 8000

# Terminal 2 — Celery worker
uv run celery -A lunedoc_api.workers.celery_app worker --loglevel=info

# Terminal 3 — Celery beat (TTL sweeper)
uv run celery -A lunedoc_api.workers.celery_app beat --loglevel=info
```

API mounts under `/api/v1`. OpenAPI docs at `http://localhost:8000/docs`.

---

## Endpoints (Phase 0)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/healthz` | `{status, version, db, redis}` |
| POST | `/api/v1/files` | Upload one file (multipart). Returns `{file_id, owner_token, expires_at, name, size, mime}` |
| GET | `/api/v1/files/:id` | Metadata. Requires `X-Owner-Token` header. |
| GET | `/api/v1/files/:id/download` | Stream bytes. Requires `X-Owner-Token`. |
| DELETE | `/api/v1/files/:id` | Idempotent delete. Always 204. Requires `X-Owner-Token` to actually delete. |

Phase 0 also registers stub paths under `/api/v1/jobs/*`, `/api/v1/auth/*`, `/api/v1/me/*` that return **501 Not Implemented**. They're visible in `/docs` so the API surface is discoverable from day one.

### Owner-token model

- POST returns `owner_token` (32 chars, base32). The server stores only the HMAC-SHA256 hash of `(token, OWNER_TOKEN_PEPPER)`.
- All other endpoints require the same token via the `X-Owner-Token` header.
- Wrong/missing token returns **404** (don't leak existence) — except `DELETE`, which returns **204** unconditionally per `docs/backend-api-plan.md` §6.4.

### Limits

- **MIME whitelist** (sniffed via libmagic, never trusts `Content-Type`):
  `application/pdf`, `image/png`, `image/jpeg`, `image/tiff`, `image/webp`,
  Office: `application/vnd.openxmlformats-officedocument.{wordprocessingml.document,spreadsheetml.sheet,presentationml.presentation}`.
  Reject → **415**.
- **Size cap:** `MAX_UPLOAD_BYTES` (default 50 MB). Reject → **413**.
- **TTL:** `FILE_TTL_SECONDS` (default 3600). Sweeper runs every 60 s and deletes expired rows + their storage objects.

---

## Tests

```bash
# Apply test-DB schema once
uv run alembic -x db=test upgrade head

# Run the suite
uv run pytest -v
```

Tests use the `lunedoc_test` database (separate from dev). The conftest truncates the `files` table before each test for isolation.

---

## Smoke verification (after `uv sync` + Postgres set up)

```bash
# Healthcheck
curl -s http://localhost:8000/api/v1/healthz | jq

# Upload
RESP=$(curl -s -X POST http://localhost:8000/api/v1/files -F file=@/tmp/sample.pdf)
echo "$RESP" | jq
FILE_ID=$(echo "$RESP" | jq -r .file_id)
TOKEN=$(echo "$RESP" | jq -r .owner_token)

# Get metadata
curl -s http://localhost:8000/api/v1/files/$FILE_ID -H "X-Owner-Token: $TOKEN" | jq

# Download → diff against original
curl -s http://localhost:8000/api/v1/files/$FILE_ID/download \
  -H "X-Owner-Token: $TOKEN" -o /tmp/round-trip.pdf
diff /tmp/sample.pdf /tmp/round-trip.pdf  # exit 0

# Idempotent delete
curl -s -X DELETE http://localhost:8000/api/v1/files/$FILE_ID \
  -H "X-Owner-Token: $TOKEN" -o /dev/null -w "%{http_code}\n"  # 204
curl -s -X DELETE http://localhost:8000/api/v1/files/$FILE_ID \
  -H "X-Owner-Token: $TOKEN" -o /dev/null -w "%{http_code}\n"  # 204 again

# Sweeper test
docker compose exec ... # — N/A; instead force-expire via psql:
PGPASSWORD=lunedoc_dev_password psql -h localhost -U lunedoc -d lunedoc_dev \
  -c "UPDATE files SET expires_at = now() - interval '1 hour';"
# Wait one beat tick (~60 s)
sleep 65
# Verify file is gone via 404
curl -s http://localhost:8000/api/v1/files/$FILE_ID -H "X-Owner-Token: $TOKEN" \
  -o /dev/null -w "%{http_code}\n"  # 404
```

---

## Phase 1 next

Tool endpoints (`POST /api/v1/jobs/:tool` and friends) per `docs/backend-api-plan.md` §3 ship in Phase 1. Order: Merge → Split → Watermark → Sign → Edit → Compress → Convert → OCR.
