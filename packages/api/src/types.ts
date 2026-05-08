/**
 * DTOs that mirror services/api/src/lunedoc_api/models/*.py.
 * Field names match the JSON wire format exactly (snake_case).
 */

export type UploadedFile = {
  file_id: string;
  owner_token: string;
  name: string;
  mime: string;
  size: number;
  expires_at: string;
};

/** Subset of UploadedFile we cache in localStorage (no token in this shape). */
export type FileMeta = {
  file_id: string;
  name: string;
  mime: string;
  size: number;
  expires_at: string;
};

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export type JobTool =
  | 'merge'
  | 'split'
  | 'watermark'
  | 'sign'
  | 'ocr'
  | 'edit'
  | 'compress'
  | 'convert';

export type JobStatusResponse = {
  job_id: string;
  tool: JobTool;
  status: JobStatus;
  input_file_ids: string[];
  output_file_ids: string[];
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ResultFile = {
  file_id: string;
  name: string;
  mime: string;
  size: number;
  expires_at: string;
  download_url: string;
};

export type JobResultResponse = {
  job_id: string;
  tool: JobTool;
  status: JobStatus;
  outputs: ResultFile[];
};

export type SplitMode = 'ranges' | 'per_page';

export type SplitJobRequest = {
  file_id: string;
  mode: SplitMode;
  ranges?: number[][];
};

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type WatermarkJobRequest = {
  file_id: string;
  text: string;
  position?: WatermarkPosition;
  /** 0.1 to 1.0; defaults to 0.3 server-side. */
  opacity?: number;
  /** Degrees, -180 to 180; defaults to -30 server-side. */
  rotation?: number;
};

export type SignMode = 'text' | 'image';

/**
 * Body of POST /api/v1/jobs/sign.
 *
 * VISIBLE signature only — NOT a cryptographic e-signature. Coordinates
 * are normalized to [0, 1] fractions of the target page's dimensions
 * (origin top-left). Width is also normalized; height is derived from
 * the image's aspect ratio (image mode) or font metrics (text mode).
 */
export type SignJobRequest = {
  file_id: string;
  mode: SignMode;
  /** 1-indexed page number. */
  page: number;
  /** Normalized left edge, 0–1. */
  x: number;
  /** Normalized top edge, 0–1. */
  y: number;
  /** Normalized width, (0, 1]. */
  width: number;
  /** Required when mode='text'. Max 200 chars. */
  text?: string;
  /**
   * Required when mode='image'. Base64-encoded PNG or JPEG, optionally
   * prefixed with `data:image/png;base64,`. Capped at ~2 MB encoded.
   */
  image_data?: string;
};

export type EditOpType = 'text_overlay' | 'highlight' | 'redact' | 'shape_rect';

interface _EditBase {
  page: number;
  x: number;
  y: number;
  width: number;
}

export interface EditTextOverlay extends _EditBase {
  type: 'text_overlay';
  text: string;
}

export interface EditHighlight extends _EditBase {
  type: 'highlight';
  height: number;
  /** Hex `#rrggbb`. Defaults to yellow server-side. */
  color?: string;
}

export interface EditRedact extends _EditBase {
  type: 'redact';
  height: number;
}

export interface EditShapeRect extends _EditBase {
  type: 'shape_rect';
  height: number;
  /** Hex `#rrggbb`. Defaults to blue server-side. */
  color?: string;
}

export type EditOperation =
  | EditTextOverlay
  | EditHighlight
  | EditRedact
  | EditShapeRect;

/**
 * Body of POST /api/v1/jobs/edit.
 *
 * Edit is intentionally an overlay/redact editor. For redact ops the
 * server applies true redaction (PyMuPDF `apply_redactions`) so the
 * underlying text is removed from the PDF stream — not just covered.
 */
export type EditJobRequest = {
  file_id: string;
  operations: EditOperation[];
};

export type CompressLevel = 'low' | 'medium' | 'high';

export type CompressJobRequest = {
  file_id: string;
  /** Defaults to 'medium' server-side. */
  level?: CompressLevel;
};

export type ConvertFormat = 'PDF' | 'JPG' | 'PNG' | 'DOCX' | 'XLSX' | 'PPTX';

/**
 * Allowed (from, to) pairs accepted by POST /api/v1/jobs/convert.
 * Anything else returns 422 with this list in the error body.
 *
 * Note: PDF → XLSX is **not** in the set. The host LibreOffice
 * release ships no working PDF-to-spreadsheet filter chain on Linux;
 * we reject it explicitly rather than producing a broken file.
 */
export const ALLOWED_CONVERT_PAIRS: ReadonlyArray<readonly [ConvertFormat, ConvertFormat]> = [
  ['PDF', 'JPG'],
  ['PDF', 'PNG'],
  ['PDF', 'DOCX'],
  ['PDF', 'PPTX'],
  ['JPG', 'PDF'],
  ['PNG', 'PDF'],
  ['DOCX', 'PDF'],
] as const;

export type ConvertJobRequest = {
  file_id: string;
  from_format: ConvertFormat;
  to_format: ConvertFormat;
  /** Reserved for Phase 3 OCR. Must be false today; route returns 422 otherwise. */
  ocr?: boolean;
  /** PDF→JPG/PNG only; ignored for other directions. Defaults to 150. */
  image_dpi?: number;
};

export type OcrMode = 'extract' | 'searchable';

/**
 * Tesseract language codes — NOT the en/tr/es shorthand the rest of
 * the system uses. Map en→eng, tr→tur, es→spa client-side before
 * sending. The frontend's `auto` UI value resolves to one of these
 * based on the current Lang prop.
 */
export type OcrLang = 'eng' | 'tur' | 'spa';

export type OcrJobRequest = {
  file_id: string;
  mode: OcrMode;
  lang: OcrLang;
};

/** Free-tier OCR page cap — keep in sync with backend OCR_FREE_PAGE_CAP. */
export const OCR_FREE_PAGE_CAP = 20;

// ── auth (Phase 4) ────────────────────────────────────────────────────────
// Mirrors services/api/src/lunedoc_api/auth/schemas.py. Field names are the
// JSON wire format (snake_case).

export type EmailStartRequest = { email: string };

export type EmailStartResponse = { ok: boolean };

/**
 * Body of POST /auth/email/verify. Exactly one of `code` (6 digits) or
 * `link_token` (32-char base32 from the magic link) must be supplied.
 */
export type EmailVerifyRequest = {
  email: string;
  code?: string;
  link_token?: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

/**
 * Returned by /auth/email/verify and /auth/refresh. The refresh token
 * rotates on every refresh — replace the stored value each time.
 */
export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  /** Always "Bearer" today, but the API surfaces it explicitly. */
  token_type: string;
  /** Access-token lifetime in seconds. */
  expires_in: number;
  user: AuthUser;
};

export type RefreshRequest = { refresh_token: string };

export type LogoutRequest = { refresh_token?: string };

export type ClaimRequest = { owner_tokens: string[] };

export type ClaimResponse = {
  files_claimed: number;
  jobs_claimed: number;
};

// ── /me dashboard (Phase 4 Step 2A) ───────────────────────────────────────
// Mirrors services/api/src/lunedoc_api/models/me.py. Pagination envelope is
// {items, limit, offset, total} across all three reads. owner_token_hash is
// deliberately absent — the backend never serializes it.

export type MeJobItem = {
  job_id: string;
  tool: JobTool;
  status: JobStatus;
  input_file_ids: string[];
  output_file_ids: string[];
  error: string | null;
  /** Slice of the job's `params` JSONB, populated by compress/ocr/convert. */
  result_meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type MeJobsResponse = {
  items: MeJobItem[];
  limit: number;
  offset: number;
  total: number;
};

export type MeFileItem = {
  file_id: string;
  name: string;
  mime: string;
  size: number;
  expires_at: string;
  created_at: string;
};

export type MeFilesResponse = {
  items: MeFileItem[];
  limit: number;
  offset: number;
  total: number;
};

export type MeUsageResponse = {
  /** Hardcoded 'free' until a tier column lands. */
  tier: 'free';
  total_files: number;
  total_jobs: number;
  jobs_by_status: Record<string, number>;
  jobs_by_tool: Record<string, number>;
  /** Always 0 today; daily OCR-page tracking lands with quota work. */
  ocr_pages_used_today: number;
};
