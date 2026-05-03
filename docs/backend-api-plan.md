# Lunedoc — Backend API Design (Proposal)

**Status:** proposal only. No backend code yet. Current frontend prototype (`index.html` + JSX) stays unchanged. Document is the single source of truth until we begin implementation.

**Scope:** API surface, file lifecycle, stack recommendation, security model, and a build-order plan that gets a useful product live with the smallest first wave of work.

---

## 1. MVP tool list

These eight tools must be reachable through the API for MVP launch. Numbers in parens are the rough cost/complexity tier (1 = trivial, 5 = expensive).

| # | Tool | Tier | Primary library/binary | Notes |
|---|---|---|---|---|
| 1 | Compress PDF | 2 | Ghostscript | Three quality presets (`screen`, `ebook`, `printer`). |
| 2 | Merge PDF | 1 | PyMuPDF | Concatenate N PDFs in user-chosen order. |
| 3 | Split PDF | 1 | PyMuPDF | By page ranges or "every N pages." |
| 4 | Convert PDF | 4 | LibreOffice headless + Pillow | Office → PDF, image → PDF, PDF → image (each direction). |
| 5 | Watermark PDF | 2 | PyMuPDF | Text watermark, position/opacity/rotation. |
| 6 | Sign PDF | 2 | PyMuPDF + Pillow | Drop signature image at coordinates. Real e-sig (PAdES) is post-MVP. |
| 7 | OCR PDF | 5 | Tesseract + PyMuPDF | Extract text or rebuild as searchable PDF. Slowest, language-pack heavy. |
| 8 | Edit PDF | 3 | PyMuPDF | Overlay text/highlight/redact/shape primitives. True content editing is post-MVP. |

---

## 2. Proposed API surface

Versioned base: `/api/v1`. JSON for control plane; `multipart/form-data` for uploads; `application/octet-stream` for downloads.

### 2.1 File / session

```
POST   /api/v1/files                    Upload one file. Returns { file_id, expires_at, owner_token }.
GET    /api/v1/files/:file_id           Metadata: { name, size, mime, status, expires_at }.
DELETE /api/v1/files/:file_id           Manual delete. Idempotent.
GET    /api/v1/files/:file_id/download  Stream the file. 404 after auto-delete.
```

`owner_token` is a short opaque string returned at upload. Anonymous users must echo it on `DELETE` and on job creation; signed-in users get implicit ownership via `user_id`. This lets the entire MVP work without auth.

### 2.2 Jobs (tool execution)

One discriminated endpoint keeps the client uniform:

```
POST   /api/v1/jobs/:tool               Create a job for `tool` ∈ { compress | merge | split | convert | watermark | sign | ocr | edit }.
GET    /api/v1/jobs/:job_id             Status: { state, progress, result_file_id?, error? }.
DELETE /api/v1/jobs/:job_id             Cancel a queued/running job.
GET    /api/v1/jobs/:job_id/result      302 → signed download URL for result_file_id (convenience).
```

`state` values: `queued | running | succeeded | failed | cancelled`. `progress` is `0..1`, best-effort.

**All tools are async.** Even fast ones (Sign, Edit) return a `job_id`. This gives a single client model and makes per-tool latency variance invisible. For sub-second tools we can later add `Prefer: wait=5` semantics that block the response if the job finishes within the wait budget — but it's a future optimization, not MVP.

### 2.3 Auth (placeholder for MVP+1)

```
POST   /api/v1/auth/email/start         Email link or OTP.
POST   /api/v1/auth/email/verify        Returns { access_token, refresh_token }.
POST   /api/v1/auth/oauth/google        OAuth 2.0 callback handler.
POST   /api/v1/auth/refresh             Refresh access token.
POST   /api/v1/auth/logout              Revoke refresh token.
GET    /api/v1/auth/me                  Current user.
```

Anonymous flow works without these; sign-in is a layer on top.

### 2.4 Dashboard / history (placeholder for MVP+1)

```
GET    /api/v1/me/jobs?cursor=&limit=   Paginated job history (signed-in only).
GET    /api/v1/me/files?cursor=&limit=  Files still alive in storage.
GET    /api/v1/me/usage                 Quota + plan info.
```

---

## 3. Per-tool contracts

All requests carry `Authorization: Bearer <token>` if signed in, or `X-Owner-Token: <token>` if anonymous. All responses include `job_id` and current `state`.

### 3.1 Compress

```
POST /api/v1/jobs/compress
{
  "file_id": "f_01HMZ…",
  "options": { "preset": "ebook" }   // "screen" | "ebook" | "printer"
}
→ 202 { "job_id": "j_01HMZ…", "state": "queued" }
```

**Async.** Ghostscript invocation: `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/<preset> …`. P50 ~1s/MB.

### 3.2 Merge

```
POST /api/v1/jobs/merge
{
  "file_ids": ["f_01…", "f_02…", "f_03…"],
  "options": { "filename": "merged.pdf" }
}
→ 202 { "job_id": "j_…" }
```

**Async.** PyMuPDF `Document.insert_pdf` in order. Trivial CPU.

### 3.3 Split

```
POST /api/v1/jobs/split
{
  "file_id": "f_…",
  "options": {
    "mode": "ranges",            // "ranges" | "every"
    "ranges": ["1-3", "5", "7-9"],
    "every": 1                   // when mode = "every"
  }
}
→ 202 { "job_id": "j_…" }
```

**Async.** Result is a ZIP of N output PDFs (single `result_file_id`). Trivial CPU.

### 3.4 Convert

```
POST /api/v1/jobs/convert
{
  "file_id": "f_…",
  "options": {
    "from": "docx",              // "docx"|"pptx"|"xlsx"|"pdf"|"jpg"|"png"
    "to":   "pdf",               // "pdf"|"jpg"|"png"|"docx"
    "ocr_on_scan": false
  }
}
→ 202 { "job_id": "j_…" }
```

**Async.** Office → PDF goes through `soffice --headless --convert-to pdf`. PDF → image uses PyMuPDF page rasterization. PDF → DOCX is a real product hole; defer or use `pdf2docx` knowing layout fidelity is mediocre.

**Cost:** LibreOffice startup is ~2s; keep a warm pool of soffice processes per worker to amortize.

### 3.5 Watermark

```
POST /api/v1/jobs/watermark
{
  "file_id": "f_…",
  "options": {
    "text": "DRAFT",
    "position": "center",        // tl|tr|center|bl|br
    "opacity": 0.30,             // 0..1
    "rotation_deg": 45,
    "apply": "all"               // "all" | { "pages": [1,3,5] }
  }
}
→ 202 { "job_id": "j_…" }
```

**Async.** PyMuPDF: insert text on each target page with `Page.insert_textbox` over a transparent layer.

### 3.6 Sign

```
POST /api/v1/jobs/sign
{
  "file_id": "f_…",
  "options": {
    "fields": [
      { "type": "signature", "page": 3, "x_pct": 0.55, "y_pct": 0.78, "w_pct": 0.30, "h_pct": 0.06,
        "render": { "kind": "typed", "text": "Maya Hadid", "style": "signature" } },
      { "type": "date",      "page": 3, "x_pct": 0.55, "y_pct": 0.86, "value": "2026-05-02" }
    ]
  }
}
→ 202 { "job_id": "j_…" }
```

`render.kind` ∈ `typed | drawn (PNG data URL) | uploaded (file_id)`.

**Async** by uniformity, but P50 is < 500 ms — ideal candidate for the future `Prefer: wait` optimization.

**Note:** this is a *visible* signature mock, not a cryptographic e-signature. Real PAdES (LTV-PAdES) is a separate, regulated workstream — defer until paid plans need it.

### 3.7 OCR

```
POST /api/v1/jobs/ocr
{
  "file_id": "f_…",
  "options": {
    "lang": "auto",              // "auto"|"en"|"tr"|"es" (Tesseract code map: eng|tur|spa)
    "mode": "extract"            // "extract" → .txt, "searchable" → searchable PDF
  }
}
→ 202 { "job_id": "j_…" }
```

**Async, slowest tool.** Tesseract on rasterized page images at 300 DPI. P50 ≈ 3–8 s/page on CPU. Recommendations:

- Pre-detect language with `langdetect` on a sample page when `lang=auto`, then call Tesseract once with the right pack.
- Searchable-PDF mode pipes Tesseract → `hocr2pdf` (or PyMuPDF `Page.insert_text` invisibly).
- Cap free-tier OCR at, e.g., 20 pages per file. Past that, return `429` with an upgrade hint.

### 3.8 Edit

```
POST /api/v1/jobs/edit
{
  "file_id": "f_…",
  "options": {
    "elements": [
      { "type": "text",      "page": 3, "x_pct": 0.50, "y_pct": 0.12, "text": "Approved by accounting", "color": "#000" },
      { "type": "highlight", "page": 3, "x_pct": 0.09, "y_pct": 0.32, "w_pct": 0.78, "h_pct": 0.024, "color": "#FFE066" },
      { "type": "redact",    "page": 3, "x_pct": 0.32, "y_pct": 0.44, "w_pct": 0.36, "h_pct": 0.032 },
      { "type": "shape",     "page": 3, "x_pct": 0.12, "y_pct": 0.78, "w_pct": 0.42, "h_pct": 0.12, "stroke": "outline", "color": "#000" }
    ]
  }
}
→ 202 { "job_id": "j_…" }
```

**Async** by uniformity. Internally fast (PyMuPDF overlay primitives). For redaction, **must** use PyMuPDF `Page.add_redact_annot()` followed by `apply_redactions()` so the underlying text is destroyed — not just covered.

---

## 4. File lifecycle

```
┌─────────┐  upload   ┌──────────┐  enqueue  ┌──────────┐  process  ┌──────────┐
│ Client  │──────────▶│ API node │──────────▶│  Queue   │──────────▶│  Worker  │
└────┬────┘           └─────┬────┘           └──────────┘           └────┬─────┘
     │                      │                                            │
     │      ◀─ owner_token ─┤                                            │
     │                      │                                            │ writes
     │                      ▼                                            ▼
     │                ┌──────────┐                                ┌──────────┐
     │                │ uploads/ │                                │ results/ │
     │                │ TTL=1h   │                                │ TTL=1h   │
     │                └──────────┘                                └──────────┘
     │                                                                  ▲
     │                  poll /jobs/:id                                   │
     ├──────────────────────────────────────────────────────────────────▶│
     │                  GET /files/:result_id/download (signed URL)      │
     └──────────────────────────────────────────────────────────────────▶│
```

### 4.1 Stages

1. **Upload.** Multipart POST. Write to `uploads/<file_id>` with object metadata `expires_at = now + 1h`. Return `{file_id, owner_token, expires_at}`.
2. **Temporary storage.** Local disk in dev (`/var/lib/lunedoc/uploads`), S3-compatible bucket in prod. Same `file_id → object_key` mapping in both.
3. **Processing queue.** Redis-backed (BullMQ or Celery). One queue per tool family lets us scale OCR/Convert workers independently from Sign/Edit. Job payload carries `file_id(s)` + `options` + `owner_token`.
4. **Result storage.** Worker writes to `results/<result_file_id>` with the same TTL semantics. Result files are first-class `File` records; clients download them via the standard `/files/:id/download` route.
5. **Auto-delete.** A separate sweeper (cron or periodic worker) deletes any object whose `expires_at` has passed. Default TTL: **1 hour from upload, OR job completion + 1 hour**, whichever is later. User can extend by pinning a job (signed-in only, post-MVP).

### 4.2 Failure modes

- Upload abort: client never sees `file_id` → object orphaned → swept at TTL.
- Worker crash mid-job: job state stays `running`, gets reaped after `worker_stale_after = 10 min` and re-queued (max 2 retries).
- Storage write failure on result: job → `failed` with operator-readable error; original file untouched.

---

## 5. Stack recommendation

### 5.1 Recommended: Python + FastAPI + Celery + Redis

**API layer:** FastAPI on Uvicorn behind Caddy/Nginx. Pydantic models give us OpenAPI for free, which the future Flutter client and any third-party integration can consume directly.

**Workers:** Celery (or Dramatiq for a lighter footprint) consuming Redis. One worker pool per tool family:
- `light` — sign, edit, watermark, merge, split (P50 < 1 s).
- `heavy-cpu` — compress, convert.
- `ocr` — OCR only, separately scaled, optionally GPU-bound later.

**Why Python over Node:**
- PDF tooling is significantly stronger in Python: PyMuPDF, pdfplumber, pytesseract, ReportLab, pdfrw — mature, well-documented, no shelling out.
- LibreOffice integration via `unoconv` / direct `soffice` is well-trodden in Python deployments.
- I/O work in FastAPI is async and competitive with Node for an API of this shape.

### 5.2 Alternative: Node.js + Fastify + BullMQ + Redis

Pick this if the eventual frontend migration is Vite/React/Remix and the team strongly prefers one language end-to-end. Tradeoffs:
- BullMQ has excellent DX (Bull Board UI, typed jobs).
- PDF libraries are weaker. `pdf-lib` is decent for assembly; OCR/Convert still shell out to Tesseract/LibreOffice. You end up writing more glue.
- Acceptable, but you're paying a 2–3× development cost on the actual PDF engines.

### 5.3 Hybrid (most pragmatic if team is JS-native)

- **API + light tools** in Node/Fastify.
- **Workers for OCR, Convert** in Python (Celery or a thin FastAPI internal service).
- Single Redis broker; both languages enqueue/consume the same job format.

This isolates the PDF complexity in one Python service while keeping the public API in the team's primary language.

### 5.4 Storage

- **Dev/local:** local disk under a single root (`STORAGE_ROOT=/var/lib/lunedoc`). Wrap behind a `Storage` interface so the call sites don't change.
- **Prod:** start on **Cloudflare R2** (S3-compatible, zero egress fees — important for a PDF download product). Bunny Storage and Backblaze B2 are also fine. Pure AWS S3 is the most portable but most expensive on egress.
- All access through pre-signed URLs; no public buckets.

### 5.5 Other infrastructure

- **DB:** Postgres for users, jobs, files index, audit log. SQLite is enough for the very first weeks of dev.
- **Object storage:** see 5.4.
- **Cache + queue:** Redis (single instance; cluster only if necessary).
- **Process manager:** systemd in dev, Kubernetes or Fly Machines in prod.
- **Observability:** structured JSON logs, OpenTelemetry traces, Prometheus metrics on job durations and queue depth.

---

## 6. Security & privacy

### 6.1 Input validation

- **Max file size.** 50 MB anonymous, 200 MB Pro, 1 GB Business. Enforce at the proxy (Nginx `client_max_body_size`) AND in the API to bail early.
- **MIME validation.** Sniff magic bytes (`python-magic` or `file(1)`); never trust `Content-Type`. Whitelist exactly: `application/pdf`, `image/{png,jpeg,tiff,webp}`, `application/{vnd.openxmlformats-…document,…sheet,…presentation}`.
- **Page count cap.** Hard cap PDF page count per tier (e.g., 200 pages free, 1000 Pro). Read with PyMuPDF before queuing the job.
- **Filename sanitization.** Treat user-supplied filename as display-only; never use it for filesystem paths. Storage key is always `<uuid>`.

### 6.2 Malware

- **Virus scan placeholder.** ClamAV daemon next to the API; scan on upload before issuing `file_id`. Synchronous gate. Defer the integration to MVP+1; for MVP, log a warning and accept (acceptable for a controlled launch with size caps).

### 6.3 Download

- **Pre-signed URLs.** All downloads via signed URL with 5-minute TTL. Signed by HMAC over `file_id + expires_at + owner_token_hash`.
- **Range requests** supported for large files.
- **No directory listing.** Storage is opaque keyspace.

### 6.4 Deletion

- **Auto-delete:** 1-hour TTL (see §4.1). Sweeper logs every deletion.
- **Manual delete:** `DELETE /files/:id` — idempotent; returns 204 whether the file exists or not (don't leak existence).
- **No backup.** Files are ephemeral; we don't take snapshots of user uploads. State this in the privacy policy.
- **Right-to-erasure (signed-in users):** `DELETE /me` cascades through jobs and any cached metadata.

### 6.5 Rate limits

| Surface | Anonymous | Signed-in (free) | Pro |
|---|---|---|---|
| Uploads | 10/min, 50/hr | 30/min, 300/hr | 120/min |
| Job creation | 20/hr | 100/hr | 1000/hr |
| OCR pages/day | 20 pages | 100 | 5000 |
| Auth attempts | 5/min/IP | n/a | n/a |

Enforced with Redis (sliding window). Returns `429` with `Retry-After`.

### 6.6 Transport & hardening

- TLS only; HSTS preload.
- CORS allowlist for the web origin; mobile clients use bearer tokens, no cookies, no CORS dependency.
- CSP on the prototype origin (already a static page) to prevent JS injection from a future user-uploaded preview embed.
- Secrets via env, not in repo. Rotate signing keys on a schedule.

---

## 7. Future mobile / Flutter compatibility

**The API is already Flutter-ready** because it's plain JSON with bearer auth. Specifically:

- **Identical endpoints.** No web-only assumptions; no HTML-form-only endpoints; everything works equally from `dart:io HttpClient` or Dio.
- **Auth:** JWT access (~15 min) + refresh (~30 days). Store refresh in iOS Keychain / Android EncryptedSharedPreferences. Never in plain SharedPreferences. Web uses an HttpOnly cookie for refresh + memory access token to mirror the same model server-side.
- **Upload progress:**
  - Web: `XMLHttpRequest` `progress` event or `fetch()` with a `ReadableStream` body.
  - Flutter: `http.MultipartRequest` with a custom `StreamedRequest` wrapper for byte-level progress, or `dio` which supports `onSendProgress` natively.
- **Background job status:** start with polling at 1.5 s intervals with exponential backoff to 5 s. Layer in **push notifications** for job completion via FCM (Android/iOS) and Web Push later — all pushed from the same server-side hook on `state → succeeded`.
- **Versioning.** `/v1/...` lets us ship breaking changes as `/v2/...` without breaking older app builds (mobile users can't be force-updated).
- **Discovery.** Publish OpenAPI at `/api/v1/openapi.json`; auto-generate Dart client from it (`openapi-generator-cli`) so the mobile app never hand-rolls request types.

---

## 8. Recommended MVP build order

The order optimizes for **earliest useful product**, lowest infra surface, and saving the expensive tools for last.

### Phase 0 — Skeleton (week 1)

1. FastAPI app + Postgres + Redis running locally via `docker-compose`.
2. `Storage` abstraction with local-disk implementation.
3. Endpoints: `POST /files`, `GET /files/:id`, `DELETE /files/:id`, `GET /files/:id/download`. No auth.
4. Sweeper cron deleting expired files.
5. Healthchecks + structured logging.

### Phase 1 — Easy tools (week 2)

Build the trivial-CPU tools first to prove the job pipeline end-to-end before paying for hard ones.

6. **Merge** — PyMuPDF `insert_pdf`. ~1 day.
7. **Split** — PyMuPDF `select`. ~1 day.
8. **Watermark** — PyMuPDF `insert_textbox`. ~1 day.
9. **Sign** — PyMuPDF + Pillow image stamp. ~2 days.
10. **Edit** — PyMuPDF overlay primitives + `apply_redactions`. ~2 days.

After this phase, five of eight tools work end-to-end.

### Phase 2 — Heavier tools (week 3–4)

11. **Compress** — Ghostscript wrapper, three presets. ~2 days. Add a worker process pool.
12. **Convert** — LibreOffice headless for Office; Pillow for images. Pre-warm `soffice` workers. ~5 days.

### Phase 3 — OCR (week 5)

13. **OCR** — Tesseract integration, language detection, both extract and searchable-PDF modes. Cap free pages. ~5 days.

### Phase 4 — Auth + dashboard (week 6)

14. Email passwordless + Google OAuth.
15. `/me/jobs`, `/me/files`, `/me/usage`.
16. Pricing/quota enforcement against rate-limit + per-tool caps.

### Phase 5 — Production hardening (week 7)

17. Move storage to R2 (no code change beyond env).
18. ClamAV on upload path.
19. Pre-signed download URLs.
20. Bull Board / Flower for queue ops visibility.
21. Backups for Postgres only (NOT user files — those are intentionally ephemeral).

### Tools that should be open-source/local-only first

All of them. Every MVP tool has a credible open-source path (Ghostscript, PyMuPDF, LibreOffice, Tesseract, Pillow). **Do not** integrate a paid SaaS for any tool until you have measured a real bottleneck. Specifically:

- Don't use AWS Textract, Google Document AI, or Azure OCR for MVP. Tesseract is free and adequate for the page volumes a free tier will see.
- Don't use Adobe PDF Services. PyMuPDF + LibreOffice cover the MVP feature set.
- Don't use a hosted virus scanner (VirusTotal API). Self-host ClamAV.

### Tools that are hard or expensive — be honest

- **Convert (Office ↔ PDF).** LibreOffice is correct but slow to spin up. Worker pool is mandatory. PDF → DOCX is fundamentally lossy regardless of vendor; set user expectations in the UI.
- **OCR.** Tesseract is CPU-bound and slow on long documents. Plan worker autoscaling on queue depth. If/when usage warrants, **Tesseract on GPU** (PaddleOCR / EasyOCR are GPU-friendlier alternatives) or a paid API for the Pro tier.
- **Edit (real content editing, not overlays).** True text-flow editing of an existing PDF is a different product altogether (think Acrobat Pro). Our MVP is intentionally an overlay editor + redaction. Do not promise more in copy.

---

## Decisions still open

- **API style:** REST as drafted, or JSON-RPC over a single endpoint? REST as drafted unless a strong reason emerges.
- **WebSockets / SSE for job updates:** post-MVP. Polling is fine for first launch.
- **Per-region storage (data residency for EU users):** post-MVP. R2 has EU jurisdiction options; revisit when paid plans launch.
- **Cryptographic signatures (PAdES):** post-MVP, paid-only. Adds a CA/HSM dependency.

---

*End of proposal.*
