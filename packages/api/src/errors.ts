/**
 * Typed errors that mirror the API's HTTP status codes. Widgets pattern-match
 * on the class so the i18n key for the toast / inline message stays close to
 * the underlying cause rather than buried in stringly-typed message parsing.
 */

export class LunedocApiError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, detail?: string, message?: string) {
    super(message ?? detail ?? `Lunedoc API error ${status}`);
    this.name = 'LunedocApiError';
    this.status = status;
    this.detail = detail;
  }
}

export class NotFoundError extends LunedocApiError {
  constructor(detail?: string) {
    super(404, detail);
    this.name = 'NotFoundError';
  }
}

export class TooLargeError extends LunedocApiError {
  constructor(detail?: string) {
    super(413, detail);
    this.name = 'TooLargeError';
  }
}

export class UnsupportedMediaTypeError extends LunedocApiError {
  constructor(detail?: string) {
    super(415, detail);
    this.name = 'UnsupportedMediaTypeError';
  }
}

export class ValidationError extends LunedocApiError {
  constructor(detail?: string) {
    super(422, detail);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends LunedocApiError {
  constructor(detail?: string) {
    super(409, detail);
    this.name = 'ConflictError';
  }
}

export class GoneError extends LunedocApiError {
  constructor(detail?: string) {
    super(410, detail);
    this.name = 'GoneError';
  }
}

export type QuotaName = 'ocr_pages_daily' | 'jobs_per_hour' | 'concurrent_jobs';

export type QuotaExceededDetail = {
  code: 'quota_exceeded';
  quota: QuotaName;
  limit: number;
  used: number;
  reset_at: string;
};

export class QuotaExceededError extends LunedocApiError {
  quota: QuotaName;
  limit: number;
  used: number;
  resetAt: string;
  constructor(detail: QuotaExceededDetail) {
    super(429, undefined, `quota exceeded: ${detail.quota}`);
    this.name = 'QuotaExceededError';
    this.quota = detail.quota;
    this.limit = detail.limit;
    this.used = detail.used;
    this.resetAt = detail.reset_at;
  }
}

export class UnauthorizedError extends LunedocApiError {
  constructor(detail?: string) {
    super(401, detail);
    this.name = 'UnauthorizedError';
  }
}

export class JobFailedError extends LunedocApiError {
  jobError: string;
  constructor(jobError: string) {
    super(0, jobError);
    this.name = 'JobFailedError';
    this.jobError = jobError;
  }
}

export class JobTimeoutError extends LunedocApiError {
  constructor(timeoutMs: number) {
    super(0, `polling exceeded ${timeoutMs}ms`);
    this.name = 'JobTimeoutError';
  }
}

export class BackendUnreachableError extends LunedocApiError {
  cause?: unknown;
  constructor(cause?: unknown) {
    super(0, 'backend unreachable');
    this.name = 'BackendUnreachableError';
    this.cause = cause;
  }
}

/** Build a typed error from a non-2xx Response. */
export async function fromResponse(resp: Response): Promise<LunedocApiError> {
  let detail: string | undefined;
  let detailObj: Record<string, unknown> | undefined;
  try {
    const body = await resp.clone().json();
    if (typeof body?.detail === 'string') {
      detail = body.detail;
    } else if (body?.detail && typeof body.detail === 'object') {
      detailObj = body.detail as Record<string, unknown>;
    }
  } catch {
    detail = (await resp.clone().text()) || undefined;
  }
  if (resp.status === 429 && detailObj?.code === 'quota_exceeded') {
    return new QuotaExceededError(detailObj as unknown as QuotaExceededDetail);
  }
  switch (resp.status) {
    case 401:
      return new UnauthorizedError(detail);
    case 404:
      return new NotFoundError(detail);
    case 413:
      return new TooLargeError(detail);
    case 415:
      return new UnsupportedMediaTypeError(detail);
    case 422:
      return new ValidationError(detail);
    case 409:
      return new ConflictError(detail);
    case 410:
      return new GoneError(detail);
    default:
      return new LunedocApiError(resp.status, detail);
  }
}
