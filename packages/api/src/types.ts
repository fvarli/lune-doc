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
