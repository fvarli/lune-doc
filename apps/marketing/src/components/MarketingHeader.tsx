import { Header, type Lang } from '@lunedoc/ui';

interface MarketingHeaderProps {
  lang: Lang;
  // Canonical EN path of the current page (e.g. "/ocr-pdf"). The component
  // computes the right TR/ES URL from it when the user clicks the LangSwitch.
  canonicalPath: string;
}

// Wraps @lunedoc/ui's <Header> for static-marketing use. Provides a real
// `setLang` that does a full-page navigation to the new locale's URL —
// since each Astro page is statically rendered, client-side navigation is
// the simplest correct behavior.
export function MarketingHeader({ lang, canonicalPath }: MarketingHeaderProps) {
  const setLang = (newLang: Lang) => {
    if (typeof window === 'undefined') return;
    const target = newLang === 'en' ? canonicalPath : `/${newLang}${canonicalPath}`;
    window.location.href = target;
  };
  return <Header lang={lang} setLang={setLang} />;
}
