import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Header, Footer, Icon, ToolCard, PdfThumb, LangSwitch, TOOLS, type Lang } from '@lunedoc/ui';
import { MergeToolPage } from '@lunedoc/tools';

export default function App() {
  const [lang, setLang] = useState<Lang>('en');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <Header lang={lang} setLang={setLang} />

      <main style={{ flex: 1, fontFamily: 'var(--font-sans)' }}>
        <Routes>
          <Route path="/" element={<HomePage lang={lang} setLang={setLang} />} />
          <Route path="/merge-pdf" element={<MergeToolPage lang={lang} />} />
        </Routes>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

interface HomePageProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function HomePage({ lang, setLang }: HomePageProps) {
  return (
    <div style={{ padding: '4rem 1.5rem', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
        Hello Lunedoc
      </h1>
      <p style={{ color: 'var(--fg-muted)', lineHeight: 1.55, margin: 0 }}>
        <code>apps/web</code> is alive. The prototype design canvas keeps running at{' '}
        <a href="http://localhost:8765/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          localhost:8765
        </a>
        . Real labels stream in from <code>@lunedoc/i18n</code>; switch locale below to see the swap.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: '1.5rem',
          padding: '0.75rem 1rem',
          color: 'var(--fg-muted)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          width: 'fit-content',
        }}
      >
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Locale smoke
        </span>
        <LangSwitch lang={lang} setLang={setLang} />
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          marginTop: '1.5rem',
          padding: '0.75rem 1rem',
          color: 'var(--fg-muted)',
          border: '1px solid var(--line)',
          borderRadius: 10,
        }}
      >
        <Icon name="merge" />
        <Icon name="sign" />
        <Icon name="ocr" />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: '1.5rem', maxWidth: 360 }}>
        <ToolCard toolKey={TOOLS[0].key} lang={lang} />
        <PdfThumb />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link
          to="/merge-pdf"
          className="pl-btn pl-btn-primary pl-btn-lg"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Icon name="merge" size={16} stroke="var(--accent-fg)" /> Open Merge PDF →
        </Link>
      </div>
    </div>
  );
}
