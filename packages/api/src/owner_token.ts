/**
 * Browser-local owner_token storage.
 *
 * One token per file_id. The user-facing TTL is enforced server-side
 * (1h sweeper); we keep entries here only so the same browser session
 * can re-fetch / merge / split a recently uploaded file. Cleared on
 * download success, on user-initiated "clear", and on any 404 from
 * a previously-known file_id.
 *
 * Falls back to in-memory map when localStorage is unavailable (SSR,
 * private mode where storage throws, etc.).
 */
import type { FileMeta } from './types';

const TOKEN_PREFIX = 'lunedoc.owner_token.';
const RECENT_KEY = 'lunedoc.recent_files';
const RECENT_CAP = 20;

/** True if window.localStorage is usable. */
function hasLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__lunedoc_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const memory: Map<string, string> = new Map();
let memoryRecent: FileMeta[] = [];

export function saveToken(file_id: string, token: string): void {
  if (hasLocalStorage()) {
    window.localStorage.setItem(TOKEN_PREFIX + file_id, token);
  } else {
    memory.set(file_id, token);
  }
}

export function getToken(file_id: string): string | null {
  if (hasLocalStorage()) {
    return window.localStorage.getItem(TOKEN_PREFIX + file_id);
  }
  return memory.get(file_id) ?? null;
}

export function forgetToken(file_id: string): void {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(TOKEN_PREFIX + file_id);
  } else {
    memory.delete(file_id);
  }
  // Also drop from recent index.
  const recent = recentFiles().filter((f) => f.file_id !== file_id);
  writeRecent(recent);
}

export function rememberFile(meta: FileMeta): void {
  const recent = recentFiles().filter((f) => f.file_id !== meta.file_id);
  recent.unshift(meta);
  if (recent.length > RECENT_CAP) recent.length = RECENT_CAP;
  writeRecent(recent);
}

/**
 * Snapshot of every anonymous owner_token currently held by this browser.
 * Used by the auth claim flow on sign-in to link prior anonymous work to
 * the freshly-authenticated user. Capped at 50 entries to bound the
 * payload — the backend caps at 10 per call anyway.
 */
export function listAllOwnerTokens(): string[] {
  const out: string[] = [];
  if (hasLocalStorage()) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(TOKEN_PREFIX)) {
        const v = window.localStorage.getItem(k);
        if (v) out.push(v);
      }
    }
  } else {
    for (const v of memory.values()) out.push(v);
  }
  return out.slice(0, 50);
}

export function recentFiles(): FileMeta[] {
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FileMeta[]) : [];
    } catch {
      return [];
    }
  }
  return memoryRecent;
}

function writeRecent(list: FileMeta[]): void {
  if (hasLocalStorage()) {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } else {
    memoryRecent = list;
  }
}
