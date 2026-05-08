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
  AuthUser,
  ClaimResponse,
  CompressJobRequest,
  ConvertJobRequest,
  EditJobRequest,
  EmailStartResponse,
  EmailVerifyRequest,
  JobResultResponse,
  JobStatusResponse,
  MeFilesResponse,
  MeJobsResponse,
  MeUsageResponse,
  OcrJobRequest,
  SignJobRequest,
  SplitJobRequest,
  TokenResponse,
  UploadedFile,
  WatermarkJobRequest,
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

  async createWatermarkJob(
    req: WatermarkJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/watermark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async createSignJob(
    req: SignJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async createEditJob(
    req: EditJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async createCompressJob(
    req: CompressJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/compress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async createConvertJob(
    req: ConvertJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': token,
      },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as JobStatusResponse;
  }

  async createOcrJob(
    req: OcrJobRequest,
    token: string,
  ): Promise<JobStatusResponse> {
    const resp = await this.request('/jobs/ocr', {
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

  // ── auth (Phase 4) ─────────────────────────────────────────────────────

  /**
   * Begin the email passwordless flow. The backend always returns 200
   * regardless of address validity to avoid an enumeration oracle —
   * surface a generic "check your inbox" hint to the user.
   */
  async startEmailAuth(email: string): Promise<EmailStartResponse> {
    const resp = await this.request('/auth/email/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return (await resp.json()) as EmailStartResponse;
  }

  /**
   * Complete the email passwordless flow. Supply exactly one of
   * `code` (6 digits) or `link_token` (32-char base32 from the magic
   * link). 400 on any failure — never reveals which check failed.
   */
  async verifyEmailAuth(req: EmailVerifyRequest): Promise<TokenResponse> {
    const resp = await this.request('/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return (await resp.json()) as TokenResponse;
  }

  /**
   * Rotate the refresh token. The server issues a new plaintext on
   * every call and revokes the prior one — replace the stored value.
   * Reuse of an already-rotated token revokes the entire chain.
   */
  async refreshAuth(refresh_token: string): Promise<TokenResponse> {
    const resp = await this.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    return (await resp.json()) as TokenResponse;
  }

  /**
   * Idempotent server-side. Either pass the refresh token to revoke,
   * or omit it and rely on the access token's `rt_id` claim by passing
   * an Authorization: Bearer header — but the AuthContext path uses
   * the explicit refresh-token form.
   */
  async logout(refresh_token?: string): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refresh_token ? { refresh_token } : {}),
    });
  }

  /** Currently authenticated user. 401 if the access token is bad. */
  async getAuthMe(access_token: string): Promise<AuthUser> {
    const resp = await this.request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return (await resp.json()) as AuthUser;
  }

  /**
   * Link the supplied anonymous owner_tokens to the authenticated user.
   * Idempotent server-side; rows already owned by another user are
   * skipped (never stolen). Backend caps at 10 tokens per call —
   * additional tokens beyond that are silently ignored.
   */
  async claimAnonymousWork(
    access_token: string,
    owner_tokens: string[],
  ): Promise<ClaimResponse> {
    const resp = await this.request('/auth/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ owner_tokens }),
    });
    return (await resp.json()) as ClaimResponse;
  }

  // ── /me dashboard (Phase 4 Step 2A) ────────────────────────────────────

  private mePageQuery(opts: { limit?: number; offset?: number }): string {
    const params = new URLSearchParams();
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts.offset !== undefined) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  /** Paginated list of the authenticated user's jobs, newest first. */
  async getMeJobs(
    access_token: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<MeJobsResponse> {
    const resp = await this.request(`/me/jobs${this.mePageQuery(opts)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return (await resp.json()) as MeJobsResponse;
  }

  /** Paginated list of the user's non-expired files, newest first. */
  async getMeFiles(
    access_token: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<MeFilesResponse> {
    const resp = await this.request(`/me/files${this.mePageQuery(opts)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return (await resp.json()) as MeFilesResponse;
  }

  /** Account usage summary for the dashboard header. */
  async getMeUsage(access_token: string): Promise<MeUsageResponse> {
    const resp = await this.request('/me/usage', {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return (await resp.json()) as MeUsageResponse;
  }

  // ── jobs polling ───────────────────────────────────────────────────────

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
