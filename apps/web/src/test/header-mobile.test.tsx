import { describe, it, expect, vi } from 'vitest';
import { Header } from '@lunedoc/ui';
import { createTranslator } from '@lunedoc/i18n';
import { render, screen, makeUser } from './render';

describe('Header (mobile branch)', () => {
  it('hides the rightSlot panel until the menu toggle is clicked when signed out', async () => {
    const t = createTranslator('en');
    render(
      <Header
        lang="en"
        setLang={vi.fn()}
        mobile
        rightSlot={
          <>
            <a href="/signin" data-testid="mobile-signin">
              Sign in
            </a>
            <a href="/signin" data-testid="mobile-getstarted">
              Get started
            </a>
          </>
        }
      />,
    );

    expect(screen.queryByTestId('mobile-signin')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: t('header_menu') });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'lune-mobile-header-menu');

    const user = makeUser();
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('mobile-signin')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-getstarted')).toBeInTheDocument();
  });

  it('reveals Dashboard and Logout when the menu opens for a signed-in user', async () => {
    render(
      <Header
        lang="en"
        setLang={vi.fn()}
        mobile
        rightSlot={
          <>
            <a href="/dashboard" data-testid="mobile-dashboard">
              Dashboard
            </a>
            <button type="button" data-testid="mobile-logout">
              Log out
            </button>
          </>
        }
      />,
    );

    const t = createTranslator('en');
    expect(screen.queryByTestId('mobile-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-logout')).not.toBeInTheDocument();

    const user = makeUser();
    await user.click(screen.getByRole('button', { name: t('header_menu') }));

    expect(screen.getByTestId('mobile-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-logout')).toBeInTheDocument();
  });

  it('toggles aria-expanded and panel visibility on repeated clicks', async () => {
    const t = createTranslator('en');
    render(
      <Header
        lang="en"
        setLang={vi.fn()}
        mobile
        rightSlot={<a data-testid="mobile-link">Link</a>}
      />,
    );

    const toggle = screen.getByRole('button', { name: t('header_menu') });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    const user = makeUser();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('mobile-link')).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('mobile-link')).not.toBeInTheDocument();
  });
});
