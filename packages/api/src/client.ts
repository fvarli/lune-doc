/**
 * LunedocClient — typed wrapper around the backend at /api/v1.
 *
 * Single instance per browser tab. Reads the API base URL from:
 *   1. import.meta.env.VITE_API_BASE_URL  (apps/web — Vite)
 *   2. import.meta.env.PUBLIC_API_BASE_URL (apps/marketing — Astro)
 *   3. http://localhost:8000/api/v1        (fallback for tests / dev)
 */
import {
  BackendUnreachableError,
  JobFailedError,
  JobTimeoutError,
  fromResponse,
} from './errors';
import type {
  JobResultResponse,
  JobStatusResponse,
  SplitJobRequest,
  UploadedFile,
} from './types';

function resolveApiBase(): string {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const fromVite = env?.VITE_API_BASE_URL;
  const fromAstro = env?.PUBLIC_API_BASE_URL;
  return fromVite ?? fromAstro ?? 'http://localhost:8000/api/v1';
}

export type PollOptions = {
  /** Poll interval in ms (default 1000). */
  intervalMs?: number;
  /** Hard timeout in ms (default 60000). */
  timeoutMs?: number;
  /** Optional abort signal for caller cleanup (component unmount, etc.). */
  signal?: AbortSignal;
};

export class LunedocClient {
  readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? resolveApiBase()).replace(/\/$/, '');
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private async request(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    let resp: Response;
    try {
      resp = await fetch(`${this.baseUrl}${path}`, init);
    } catch (e) {
      throw new BackendUnreachableError(e);
    }
    if (!resp.ok) {
      throw await fromResponse(resp);
    }
    return resp;
  }

  // ── files ─────────────────────────────────────────────────────────────

  /**
   * Upload a single file. If `extendToken` is provided, the new file
   * inherits that token (server validates format and reuses it); the
   * response carries the same token back. If absent, the server mints
   * a fresh token.
   */
  async uploadFile(
    file: File,
    opts: { extendToken?: string } = {},
  ): Promise<UploadedFile> {
    const body = new FormData();
    body.append('file', file, file.name);
    const headers: Record<string, string> = {};
    if (opts.extendToken) headers['X-Owner-Token'] = opts.extendToken;

    const resp = await this.request('/files', {
      method: 'POST',
      body,
      headers,
    });
    return (await resp.json()) as UploadedFile;
  }

  /**
   * Stream a file as a Blob. Caller decides what to do with it
   * (Blob URL + <a download>, etc.).
   */
  async downloadFile(file_id: string, token: string): Promise<Blob> {
    const resp = await this.request(`/files/${file_id}/download`, {
      method: 'GET',
      headers: { 'X-Owner-Token': token },
    });
    return await resp.blob();
  }

  // ── jobs ──────────────────────────────────────────────────────────────

  async createMergeJob(
    file_ids: string[],
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify({ file_ids }),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async createSplitJob(
    req: SplitJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async getJob(job_id: string, token: string): Promise<JobStatusResponse> {
    const resp = await this.request(`/jobs/${job_id}`, {
      method: 'GET',
      headers: { 'X-Owner-Token': token },
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async getJobResult(
    job_id: string,
    token: string,
  ): Promise<JobResultResponse> {
    const resp = await this.request(`/jobs/${job_id}/result`, {
      method: 'GET',
      headers: { 'X-Owner-Token': token },
    });
    return (await resp.json()) as JobResultResponse;
  }

  /**
   * Poll until status is terminal (done | failed) or timeoutMs elapses.
   * Throws JobFailedError on `failed`, JobTimeoutError on timeout,
   * or whatever fetch raises (BackendUnreachableError).
   */
  async pollJob(
    job_id: string,
    token: string,
    opts: PollOptions = {},
  ): Promise<JobStatusResponse> {
    const interval = opts.intervalMs ?? 1000;
    const timeout = opts.timeoutMs ?? 60000;
    const start = Date.now();

    // First read can short-circuit when the eager-mode worker already
    // produced a terminal status during job creation.
    let job = await this.getJob(job_id, token);
    while (job.status === 'queued' || job.status === 'running') {
      if (opts.signal?.aborted) throw new JobTimeoutError(timeout);
      if (Date.now() - start >= timeout) throw new JobTimeoutError(timeout);
      await sleep(interval, opts.signal);
      job = await this.getJob(job_id, token);
    }
    if (job.status === 'failed') {
      throw new JobFailedError(job.error ?? 'job failed');
    }
    return job;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new JobTimeoutError(ms));
    const t = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new JobTimeoutError(ms));
      },
      { once: true },
    );
  });
}

// One default client instance per tab — apps can also `new LunedocClient()`
// with a custom base URL when needed.
let _default: LunedocClient | null = null;

export function getClient(): LunedocClient {
  if (_default === null) {
    _default = new LunedocClient();
  }
  return _default;
}
