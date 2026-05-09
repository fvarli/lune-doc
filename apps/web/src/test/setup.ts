import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { getMockClient, resetMockClient } from './mock-api';

// Globally route @lunedoc/api's getClient() through a mutable mock object.
// Real exports (error classes, types) are preserved via importActual so
// that instanceof checks work in tests (UnauthorizedError, QuotaExceededError).
vi.mock('@lunedoc/api', async () => {
  const actual =
    await vi.importActual<typeof import('@lunedoc/api')>('@lunedoc/api');
  return {
    ...actual,
    getClient: () => getMockClient(),
  };
});

beforeEach(() => {
  resetMockClient();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
