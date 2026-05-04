import { useState } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
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
import { TOOL_CONFIGS, LANGS } from './landing/tool-config';
import type { ToolConfig } from './landing/tool-config';

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

interface ToolRouteProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function ToolRoute({ lang, setLang }: ToolRouteProps) {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  const config = TOOL_BY_SLUG[slug];
  if (!config) return null;
  const widget = widgetForSlug(slug, lang);
  if (!widget) return null;

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

interface LocalizedToolRouteProps {
  setLang: (lang: Lang) => void;
}

function LocalizedToolRoute({ setLang }: LocalizedToolRouteProps) {
  const { lang: paramLang } = useParams<{ lang: string; slug: string }>();
  const lang = (LANGS as string[]).includes(paramLang ?? '')
    ? (paramLang as Lang)
    : null;
  if (!lang) return null;
  return <ToolRoute lang={lang} setLang={setLang} />;
}

interface LocalizedHomeRouteProps {
  setLang: (lang: Lang) => void;
}

function LocalizedHomeRoute({ setLang }: LocalizedHomeRouteProps) {
  const { lang: paramLang } = useParams<{ lang: string }>();
  const lang = (LANGS as string[]).includes(paramLang ?? '')
    ? (paramLang as Lang)
    : null;
  if (!lang) return null;
  return <HomeLanding lang={lang} setLang={setLang} />;
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en');

  return (
    <Routes>
      {/* English at root */}
      <Route path="/" element={<HomeLanding lang={lang} setLang={setLang} />} />
      <Route path="/:slug" element={<ToolRoute lang={lang} setLang={setLang} />} />

      {/* Localized */}
      <Route path="/:lang" element={<LocalizedHomeRoute setLang={setLang} />} />
      <Route
        path="/:lang/:slug"
        element={<LocalizedToolRoute setLang={setLang} />}
      />
    </Routes>
  );
}
