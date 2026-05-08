import { Link } from 'react-router-dom';
import { useI18n } from '@lunedoc/i18n';
import type { Lang } from '@lunedoc/ui';
import { useAuth } from './AuthContext';

interface AuthHeaderControlsProps {
  lang: Lang;
}

function localized(path: string, lang: Lang): string {
  return lang === 'en' ? path : `/${lang}${path}`;
}

/**
 * Right-hand auth controls for the Header. Lives in apps/web (not
 * packages/ui) so packages/ui stays free of react-router-dom.
 *
 * Signed out: "Sign in" + "Get started" both link to /signin (the
 * email-passwordless flow doubles as registration — first verify
 * creates the user row).
 *
 * Signed in: shows the user's email next to a Logout button.
 *
 * isLoading: render nothing while the boot refresh is in flight to
 * avoid a flash of "Sign in" → "Log out".
 */
export function AuthHeaderControls({ lang }: AuthHeaderControlsProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useI18n(lang);

  if (isLoading) return null;

  if (!isAuthenticated) {
    const href = localized('/signin', lang);
    return (
      <>
        <Link
          to={href}
          className="pl-btn pl-btn-quiet pl-btn-sm"
          style={{ textDecoration: 'none' }}
        >
          {t('nav_signin')}
        </Link>
        <Link
          to={href}
          className="pl-btn pl-btn-primary pl-btn-sm"
          style={{ textDecoration: 'none' }}
        >
          {t('nav_get_started')}
        </Link>
      </>
    );
  }

  return (
    <>
      <span
        style={{
          fontSize: 13,
          color: 'var(--fg-muted)',
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={user?.email ?? ''}
      >
        {user?.email}
      </span>
      <button
        type="button"
        className="pl-btn pl-btn-quiet pl-btn-sm"
        onClick={() => {
          void logout();
        }}
      >
        {t('nav_logout')}
      </button>
    </>
  );
}
