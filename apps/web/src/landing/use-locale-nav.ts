import { useLocation, useNavigate } from 'react-router-dom';
import type { Lang } from '@lunedoc/ui';

const LOCALE_PREFIXES = new Set<Lang>(['tr', 'es']);

interface LocaleNav {
  /** Current locale derived from the URL ('en' if no prefix). */
  lang: Lang;
  /** Tool slug (e.g. "merge-pdf"), or empty string for the home route. */
  slug: string;
  /** Switch locale and rewrite the URL — preserves the current slug. */
  setLang: (next: Lang) => void;
}

/**
 * Single source of truth for "what locale + tool is the user on, and
 * what URL should we navigate to when they switch locales?"
 *
 * The URL is authoritative — `lang` is derived by parsing the leading
 * path segment, NOT by reading React state. Switching locales calls
 * navigate() with the new path so a deep-linkable URL always reflects
 * the active locale.
 *
 * Examples:
 *   /                  → { lang: 'en', slug: '' }
 *   /merge-pdf         → { lang: 'en', slug: 'merge-pdf' }
 *   /tr                → { lang: 'tr', slug: '' }
 *   /tr/split-pdf      → { lang: 'tr', slug: 'split-pdf' }
 *   /es/edit-pdf       → { lang: 'es', slug: 'edit-pdf' }
 *
 * setLang preserves the slug and rewrites the locale prefix:
 *   /merge-pdf       + setLang('tr') → /tr/merge-pdf
 *   /tr/merge-pdf    + setLang('en') → /merge-pdf
 *   /es/split-pdf    + setLang('tr') → /tr/split-pdf
 *   /tr              + setLang('es') → /es
 *   /es              + setLang('en') → /
 */
export function useLocaleNav(): LocaleNav {
  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split('/').filter(Boolean);
  const first = segments[0] as Lang | undefined;
  const hasLocalePrefix = first !== undefined && LOCALE_PREFIXES.has(first);
  const lang: Lang = hasLocalePrefix ? (first as Lang) : 'en';
  const slug = hasLocalePrefix
    ? segments.slice(1).join('/')
    : segments.join('/');

  function setLang(next: Lang): void {
    const target =
      next === 'en' ? (slug ? `/${slug}` : '/') : slug ? `/${next}/${slug}` : `/${next}`;
    navigate(target);
  }

  return { lang, slug, setLang };
}
