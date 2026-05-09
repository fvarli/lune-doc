import { vi } from 'vitest';

function createNewMockClient() {
  return {
    startEmailAuth: vi.fn(),
    verifyEmailAuth: vi.fn(),
    refreshAuth: vi.fn(),
    logout: vi.fn(),
    getMeUsage: vi.fn(),
    getMeJobs: vi.fn(),
    getMeFiles: vi.fn(),
    getAuthMe: vi.fn(),
    claimAnonymousWork: vi.fn(),
  };
}

export type MockClient = ReturnType<typeof createNewMockClient>;

let active: MockClient = createNewMockClient();

export function getMockClient(): MockClient {
  return active;
}

export function resetMockClient(): void {
  active = createNewMockClient();
}
