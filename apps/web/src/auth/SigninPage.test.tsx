import { describe, it, expect, vi } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { LunedocApiError, type TokenResponse } from '@lunedoc/api';
import { createTranslator } from '@lunedoc/i18n';
import type { Lang } from '@lunedoc/ui';
import { SigninPage } from './SigninPage';
import { getMockClient } from '../test/mock-api';
import {
  renderWithProviders,
  screen,
  waitFor,
  makeUser,
} from '../test/render';

function tokenResponse(): TokenResponse {
  return {
    access_token: 'at-1',
    refresh_token: 'rt-1',
    token_type: 'Bearer',
    expires_in: 900,
    user: { id: 'u1', email: 'a@b.com' },
  };
}

function renderSignin(lang: Lang = 'en') {
  const setLang = vi.fn();
  const route = lang === 'en' ? '/signin' : `/${lang}/signin`;
  return renderWithProviders(
    <Routes>
      <Route
        path={route}
        element={<SigninPage lang={lang} setLang={setLang} />}
      />
      <Route path="*" element={<div data-testid="home-route" />} />
    </Routes>,
    { route, withAuth: true },
  );
}

describe('SigninPage', () => {
  it('renders the email stage by default', async () => {
    renderSignin('en');
    const t = createTranslator('en');
    expect(
      await screen.findByRole('heading', { name: t('auth_signin_title') }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(t('auth_email'))).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: t('auth_continue') }),
    ).toBeInTheDocument();
  });

  it('submitting an email calls startEmailAuth and advances to the verify stage', async () => {
    getMockClient().startEmailAuth.mockResolvedValueOnce({ ok: true });
    renderSignin('en');
    const t = createTranslator('en');
    const user = makeUser();

    await user.type(screen.getByLabelText(t('auth_email')), 'a@b.com');
    await user.click(screen.getByRole('button', { name: t('auth_continue') }));

    await waitFor(() =>
      expect(getMockClient().startEmailAuth).toHaveBeenCalledWith('a@b.com'),
    );
    expect(
      await screen.findByLabelText(t('auth_code')),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: t('auth_resend_code') }),
    ).toBeInTheDocument();
  });

  it('submitting a 6-digit code calls verifyEmailAuth and navigates home', async () => {
    getMockClient().startEmailAuth.mockResolvedValueOnce({ ok: true });
    getMockClient().verifyEmailAuth.mockResolvedValueOnce(tokenResponse());
    renderSignin('en');
    const t = createTranslator('en');
    const user = makeUser();

    await user.type(screen.getByLabelText(t('auth_email')), 'a@b.com');
    await user.click(screen.getByRole('button', { name: t('auth_continue') }));
    await user.type(await screen.findByLabelText(t('auth_code')), '123456');
    await user.click(screen.getByRole('button', { name: t('auth_verify') }));

    await waitFor(() =>
      expect(getMockClient().verifyEmailAuth).toHaveBeenCalledWith({
        email: 'a@b.com',
        code: '123456',
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('home-route')).toBeInTheDocument(),
    );
  });

  it('shows auth_invalid_code when verifyEmailAuth rejects with HTTP 400', async () => {
    getMockClient().startEmailAuth.mockResolvedValueOnce({ ok: true });
    getMockClient().verifyEmailAuth.mockRejectedValueOnce(
      new LunedocApiError(400, 'bad code'),
    );
    renderSignin('en');
    const t = createTranslator('en');
    const user = makeUser();

    await user.type(screen.getByLabelText(t('auth_email')), 'a@b.com');
    await user.click(screen.getByRole('button', { name: t('auth_continue') }));
    await user.type(await screen.findByLabelText(t('auth_code')), '000000');
    await user.click(screen.getByRole('button', { name: t('auth_verify') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      t('auth_invalid_code'),
    );
  });

  it('shows auth_network_error when startEmailAuth fails with a network error', async () => {
    getMockClient().startEmailAuth.mockRejectedValueOnce(
      new TypeError('fetch failed'),
    );
    renderSignin('en');
    const t = createTranslator('en');
    const user = makeUser();

    await user.type(screen.getByLabelText(t('auth_email')), 'a@b.com');
    await user.click(screen.getByRole('button', { name: t('auth_continue') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      t('auth_network_error'),
    );
    expect(screen.getByLabelText(t('auth_email'))).toBeInTheDocument();
  });

  it('resend invokes startEmailAuth a second time and surfaces the resent toast', async () => {
    getMockClient().startEmailAuth
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });
    renderSignin('en');
    const t = createTranslator('en');
    const user = makeUser();

    await user.type(screen.getByLabelText(t('auth_email')), 'a@b.com');
    await user.click(screen.getByRole('button', { name: t('auth_continue') }));
    await user.click(
      await screen.findByRole('button', { name: t('auth_resend_code') }),
    );

    await waitFor(() =>
      expect(getMockClient().startEmailAuth).toHaveBeenCalledTimes(2),
    );
    expect(getMockClient().startEmailAuth).toHaveBeenNthCalledWith(2, 'a@b.com');
    expect(await screen.findByText(t('auth_resent'))).toBeInTheDocument();
  });

  it('renders localized strings for /tr/signin and /es/signin', async () => {
    renderSignin('tr');
    const tr = createTranslator('tr');
    expect(
      await screen.findByRole('heading', { name: tr('auth_signin_title') }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(tr('auth_email'))).toBeInTheDocument();
    expect(
      screen.queryByText('auth_signin_title'),
    ).not.toBeInTheDocument();

    renderSignin('es');
    const es = createTranslator('es');
    expect(
      await screen.findAllByRole('heading', { name: es('auth_signin_title') }),
    ).not.toHaveLength(0);
    expect(
      screen.queryByText('auth_signin_title'),
    ).not.toBeInTheDocument();
  });
});
