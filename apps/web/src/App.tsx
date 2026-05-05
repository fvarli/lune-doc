import { Route, Routes } from 'react-router-dom';
import {
  CompressToolPage,
  ConvertToolPage,
  EditPDFToolPage,
  MergeToolPage,
  OCRToolPage,
  SignToolPage,
  SplitToolPage,
  WatermarkToolPage,
} from '@lunedoc/tools';
import type { Lang } from '@lunedoc/ui';
import { ToolLandingPage } from './landing/ToolLandingPage';
import { HomeLanding } from './landing/HomeLanding';
import { TOOL_CONFIGS } from './landing/tool-config';
import type { ToolConfig } from './landing/tool-config';
import { useLocaleNav } from './landing/use-locale-nav';

const TOOL_BY_SLUG: Record<string, ToolConfig> = Object.fromEntries(
  TOOL_CONFIGS.map((c) => [c.slug, c]),
);

function widgetForSlug(slug: string, lang: Lang) {
  switch (slug) {
    case 'merge-pdf':
      return <MergeToolPage lang={lang} />;
    case 'split-pdf':
      return <SplitToolPage lang={lang} />;
    case 'compress-pdf':
      return <CompressToolPage lang={lang} />;
    case 'convert-pdf':
      return <ConvertToolPage lang={lang} />;
    case 'watermark-pdf':
      return <WatermarkToolPage lang={lang} />;
    case 'sign-pdf':
      return <SignToolPage lang={lang} />;
    case 'ocr-pdf':
      return <OCRToolPage lang={lang} />;
    case 'edit-pdf':
      return <EditPDFToolPage lang={lang} />;
    default:
      return null;
  }
}

/**
 * Single-route dispatcher. The URL is the source of truth for both
 * locale and tool slug — see use-locale-nav.ts. This collapses the
 * 4-route table from the previous shape into one splat route, which
 * also fixes a routing ambiguity where /tr would match `/:slug` first
 * and 404 inside the tool lookup.
 */
function Dispatcher() {
  const { lang, slug, setLang } = useLocaleNav();

  if (!slug) {
    return <HomeLanding lang={lang} setLang={setLang} />;
  }

  const config = TOOL_BY_SLUG[slug];
  if (!config) {
    // Unknown slug — fall back to the localized home so the URL stays
    // valid and the user gets a real page instead of a blank screen.
    return <HomeLanding lang={lang} setLang={setLang} />;
  }
  const widget = widgetForSlug(slug, lang);
  if (!widget) {
    return <HomeLanding lang={lang} setLang={setLang} />;
  }

  return (
    <ToolLandingPage
      lang={lang}
      setLang={setLang}
      canonicalPath={`/${config.slug}`}
      toolDisplayName={config.displayName}
      toolIconName={config.iconName}
      toolBadgeTone={config.badgeTone}
      content={config.content[lang]}
      relatedToolKeys={config.relatedToolKeys}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>
        {widget}
      </div>
    </ToolLandingPage>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Dispatcher />} />
    </Routes>
  );
}
