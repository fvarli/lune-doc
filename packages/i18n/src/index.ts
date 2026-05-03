import { useMemo } from 'react';
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import type { Lang } from './types';

export type { Lang, TranslationKey } from './types';

export const I18N_STRINGS = { en, tr, es } as const;

export function getStrings(lang: Lang): Record<string, string> {
  return I18N_STRINGS[lang] ?? I18N_STRINGS.en;
}

// Translator factory. Returns a `t(key)` function that:
//   1) looks up `key` in the requested locale's table
//   2) falls back to EN if the key is missing in that locale
//   3) returns the key itself if missing everywhere — visible signal that a
//      translation is needed.
export function createTranslator(lang: Lang): (key: string) => string {
  const table = getStrings(lang);
  const fallback = I18N_STRINGS.en as Record<string, string>;
  return (key: string): string => {
    return table[key] ?? fallback[key] ?? key;
  };
}

// React hook. Memoized per-locale; the same `t` reference is reused across
// renders with the same `lang`, which lets consumers safely list `t` in
// effect/memo dependency arrays without thrashing.
export function useI18n(lang: Lang): { t: (key: string) => string; lang: Lang } {
  const t = useMemo(() => createTranslator(lang), [lang]);
  return { t, lang };
}
