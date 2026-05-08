import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  UnauthorizedError,
  clearRefreshToken,
  getClient,
  listAllOwnerTokens,
  loadRefreshToken,
  saveRefreshToken,
  type AuthUser,
} from '@lunedoc/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInStart: (email: string) => Promise<void>;
  signInVerify: (
    email: string,
    payload: { code: string } | { link_token: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Run an authenticated call. On 401 we attempt one refresh-and-retry;
   * on a second 401 we log out and rethrow. Defined now so Step 2C's
   * dashboard pages can drop in without an AuthContext rework.
   */
  withAccessToken: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bootRanRef = useRef(false);

  // Boot — try to revive a session from a stored refresh token. Guarded
  // against StrictMode's double-invoke because the backend's refresh
  // reuse-detection would otherwise revoke the entire chain on mount.
  useEffect(() => {
    if (bootRanRef.current) return;
    bootRanRef.current = true;
    const stored = loadRefreshToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    const client = getClient();
    client
      .refreshAuth(stored)
      .then((resp) => {
        saveRefreshToken(resp.refresh_token);
        setAccessToken(resp.access_token);
        setUser(resp.user);
      })
      .catch((e) => {
        if (e instanceof UnauthorizedError) clearRefreshToken();
        // Network failures: leave the stored token in place so a later
        // mount can retry. Don't sign the user out for a flaky network.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signInStart = useCallback(async (email: string) => {
    await getClient().startEmailAuth(email);
  }, []);

  const signInVerify = useCallback(
    async (
      email: string,
      payload: { code: string } | { link_token: string },
    ) => {
      const client = getClient();
      const resp = await client.verifyEmailAuth({ email, ...payload });
      saveRefreshToken(resp.refresh_token);
      setAccessToken(resp.access_token);
      setUser(resp.user);
      const tokens = listAllOwnerTokens();
      if (tokens.length > 0) {
        client
          .claimAnonymousWork(resp.access_token, tokens)
          .catch(() => undefined);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const stored = loadRefreshToken();
    clearRefreshToken();
    setAccessToken(null);
    setUser(null);
    if (stored) {
      getClient()
        .logout(stored)
        .catch(() => undefined);
    }
  }, []);

  const withAccessToken = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      if (!accessToken) throw new UnauthorizedError('not signed in');
      try {
        return await fn(accessToken);
      } catch (e) {
        if (!(e instanceof UnauthorizedError)) throw e;
        const rt = loadRefreshToken();
        if (!rt) {
          await logout();
          throw e;
        }
        let next;
        try {
          next = await getClient().refreshAuth(rt);
        } catch {
          await logout();
          throw e;
        }
        saveRefreshToken(next.refresh_token);
        setAccessToken(next.access_token);
        setUser(next.user);
        try {
          return await fn(next.access_token);
        } catch (e2) {
          if (e2 instanceof UnauthorizedError) await logout();
          throw e2;
        }
      }
    },
    [accessToken, logout],
  );

  const value: AuthState = {
    user,
    accessToken,
    isAuthenticated: user !== null,
    isLoading,
    signInStart,
    signInVerify,
    logout,
    withAccessToken,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
