import en from './locales/en.json';

export type Lang = 'en' | 'tr' | 'es';

// Derived from the EN locale: every TR/ES JSON has the exact same key set
// (verified at extraction time). If a key is added to EN, the union grows
// automatically and consumers calling t() with a non-existent key fail to
// type-check.
export type TranslationKey = keyof typeof en;
