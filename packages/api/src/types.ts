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
