/**
 * Browser-local refresh-token storage for the auth flow.
 *
 * One slot only — the user is signed into one account at a time per tab.
 * The access token deliberately never lands here; it stays in memory
 * inside AuthContext so an XSS read can't trivially harvest a long-lived
 * credential. The refresh token is what survives reloads.
 *
 * Falls back to an in-memory string when localStorage is unavailable
 * (SSR, private mode where storage throws). The fallback is lossy on
 * reload, which is acceptable — without persistent storage there's no
 * way to keep a user signed in across tab restarts anyway.
 */

const REFRESH_TOKEN_KEY = 'lunedoc.auth.refresh_token';

function hasLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__lunedoc_auth_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

let memory: string | null = null;

export function loadRefreshToken(): string | null {
  if (hasLocalStorage()) {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return memory;
}

export function saveRefreshToken(token: string): void {
  if (hasLocalStorage()) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    memory = token;
  }
}

export function clearRefreshToken(): void {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    memory = null;
  }
}
