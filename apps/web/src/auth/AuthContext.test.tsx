import { StrictMode, useEffect, useRef, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  LunedocApiError,
  UnauthorizedError,
  type AuthUser,
  type TokenResponse,
} from '@lunedoc/api';
import { AuthProvider, useAuth } from './AuthContext';
import { getMockClient } from '../test/mock-api';
import { renderWithProviders, screen, waitFor, makeUser } from '../test/render';

const REFRESH_KEY = 'lunedoc.auth.refresh_token';

function tokenResponse(overrides: Partial<TokenResponse> = {}): TokenResponse {
  const user: AuthUser = { id: 'u1', email: 'user@example.com' };
  return {
    access_token: 'at-1',
    refresh_token: 'rt-2',
    token_type: 'Bearer',
    expires_in: 900,
    user,
    ...overrides,
  };
}

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="auth-loading">
        {auth.isLoading ? 'true' : 'false'}
      </span>
      <span data-testid="auth-authenticated">
        {auth.isAuthenticated ? 'true' : 'false'}
      </span>
      <span data-testid="auth-user-email">{auth.user?.email ?? ''}</span>
      <span data-testid="auth-access-token">{auth.accessToken ?? ''}</span>
      <button type="button" onClick={() => void auth.logout()}>
        logout
      </button>
    </div>
  );
}

interface ProbeWithFnProps {
  fn: (token: string) => Promise<unknown>;
}

function WithAccessTokenProbe({ fn }: ProbeWithFnProps) {
  const { withAccessToken, accessToken } = useAuth();
  const [result, setResult] = useState<string>('pending');
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    if (!accessToken) return;
    ranRef.current = true;
    withAccessToken(fn).then(
      (v) => setResult(`ok:${JSON.stringify(v)}`),
      (e: unknown) => {
        const name =
          e instanceof Error ? e.constructor.name : 'unknown';
        const msg = e instanceof Error ? e.message : String(e);
        setResult(`err:${name}:${msg}`);
      },
    );
  }, [accessToken, withAccessToken, fn]);
  return <div data-testid="with-token-result">{result}</div>;
}

describe('AuthContext', () => {
  it('finishes loading unauthenticated when no refresh token is stored', async () => {
    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() =>
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('false'),
    );
    expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
      'false',
    );
    expect(getMockClient().refreshAuth).not.toHaveBeenCalled();
  });

  it('boots an authenticated session from a stored refresh token', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-1');
    getMockClient().refreshAuth.mockResolvedValueOnce(tokenResponse());

    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() =>
      expect(screen.getByTestId('auth-user-email')).toHaveTextContent(
        'user@example.com',
      ),
    );
    expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('auth-access-token')).toHaveTextContent('at-1');
    expect(getMockClient().refreshAuth).toHaveBeenCalledTimes(1);
    expect(getMockClient().refreshAuth).toHaveBeenCalledWith('rt-1');
    expect(localStorage.getItem(REFRESH_KEY)).toBe('rt-2');
  });

  it('does not double-refresh under StrictMode', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-1');
    getMockClient().refreshAuth.mockResolvedValueOnce(tokenResponse());

    render(
      <StrictMode>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('false'),
    );
    expect(getMockClient().refreshAuth).toHaveBeenCalledTimes(1);
  });

  it('clears the stored refresh token on a 401 during boot', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-bad');
    getMockClient().refreshAuth.mockRejectedValueOnce(
      new UnauthorizedError('expired'),
    );

    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() =>
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('false'),
    );
    expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
      'false',
    );
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('keeps the stored refresh token when boot fails for a non-401 reason', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-net');
    getMockClient().refreshAuth.mockRejectedValueOnce(
      new TypeError('fetch failed'),
    );

    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() =>
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('false'),
    );
    expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
      'false',
    );
    expect(localStorage.getItem(REFRESH_KEY)).toBe('rt-net');
  });

  it('logout clears auth state and forwards the previous refresh token to the server', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-1');
    getMockClient().refreshAuth.mockResolvedValueOnce(tokenResponse());
    getMockClient().logout.mockResolvedValueOnce(undefined);

    renderWithProviders(<Probe />, { withAuth: true });
    await waitFor(() =>
      expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
        'true',
      ),
    );

    const user = makeUser();
    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() =>
      expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
        'false',
      ),
    );
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(screen.getByTestId('auth-user-email')).toHaveTextContent('');
    expect(screen.getByTestId('auth-access-token')).toHaveTextContent('');
    await waitFor(() =>
      expect(getMockClient().logout).toHaveBeenCalledWith('rt-2'),
    );
  });

  it('withAccessToken retries once after a 401 and a successful refresh', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-1');
    getMockClient().refreshAuth
      .mockResolvedValueOnce(
        tokenResponse({ access_token: 'boot-at', refresh_token: 'boot-rt' }),
      )
      .mockResolvedValueOnce(
        tokenResponse({
          access_token: 'fresh-at',
          refresh_token: 'fresh-rt',
        }),
      );

    const fn = vi
      .fn<(token: string) => Promise<string>>()
      .mockRejectedValueOnce(new UnauthorizedError('stale'))
      .mockResolvedValueOnce('done');

    renderWithProviders(
      <>
        <Probe />
        <WithAccessTokenProbe fn={fn} />
      </>,
      { withAuth: true },
    );

    await waitFor(() =>
      expect(screen.getByTestId('with-token-result')).toHaveTextContent(
        'ok:"done"',
      ),
    );
    expect(fn).toHaveBeenNthCalledWith(1, 'boot-at');
    expect(fn).toHaveBeenNthCalledWith(2, 'fresh-at');
    expect(getMockClient().refreshAuth).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(REFRESH_KEY)).toBe('fresh-rt');
  });

  it('withAccessToken logs the user out when the retry also returns 401', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-1');
    getMockClient().refreshAuth
      .mockResolvedValueOnce(
        tokenResponse({ access_token: 'boot-at', refresh_token: 'boot-rt' }),
      )
      .mockResolvedValueOnce(
        tokenResponse({
          access_token: 'fresh-at',
          refresh_token: 'fresh-rt',
        }),
      );
    getMockClient().logout.mockResolvedValue(undefined);

    const fn = vi
      .fn<(token: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new UnauthorizedError('stale'))
      .mockRejectedValueOnce(new UnauthorizedError('still bad'));

    renderWithProviders(
      <>
        <Probe />
        <WithAccessTokenProbe fn={fn} />
      </>,
      { withAuth: true },
    );

    await waitFor(() =>
      expect(screen.getByTestId('with-token-result')).toHaveTextContent(
        /^err:UnauthorizedError:/,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
        'false',
      ),
    );
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('withAccessToken logs the user out when the refresh itself fails', async () => {
    localStorage.setItem(REFRESH_KEY, 'rt-1');
    getMockClient().refreshAuth
      .mockResolvedValueOnce(
        tokenResponse({ access_token: 'boot-at', refresh_token: 'boot-rt' }),
      )
      .mockRejectedValueOnce(new LunedocApiError(500, 'boom'));
    getMockClient().logout.mockResolvedValue(undefined);

    const fn = vi
      .fn<(token: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new UnauthorizedError('stale'));

    renderWithProviders(
      <>
        <Probe />
        <WithAccessTokenProbe fn={fn} />
      </>,
      { withAuth: true },
    );

    await waitFor(() =>
      expect(screen.getByTestId('with-token-result')).toHaveTextContent(
        /^err:UnauthorizedError:/,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('auth-authenticated')).toHaveTextContent(
        'false',
      ),
    );
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });
});
