import { Header, Footer, Icon, ToolCard, PdfThumb, TOOLS } from '@lunedoc/ui';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <Header lang="en" setLang={() => {}} />

      <main
        style={{
          flex: 1,
          fontFamily: 'var(--font-sans)',
          padding: '4rem 1.5rem',
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
          Hello Lunedoc
        </h1>
        <p style={{ color: 'var(--fg-muted)', lineHeight: 1.55, margin: 0 }}>
          <code>apps/web</code> is alive. The prototype design canvas keeps running at{' '}
          <a href="http://localhost:8765/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            localhost:8765
          </a>
          . Phase 3 in progress; UI primitives are flowing in from <code>@lunedoc/ui</code>.
        </p>

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
          <ToolCard toolKey={TOOLS[0].key} />
          <PdfThumb />
        </div>
      </main>

      <Footer lang="en" />
    </div>
  );
}
