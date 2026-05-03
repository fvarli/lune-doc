import { Logo, Icon, ToolCard, PdfThumb, TOOLS } from '@lunedoc/ui';

export default function App() {
  return (
    <main
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        padding: '4rem 1.5rem',
        maxWidth: 720,
        margin: '0 auto',
        color: '#0b0b0f',
      }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <Logo size={20} />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
        Hello Lunedoc
      </h1>
      <p style={{ color: '#5b5b66', lineHeight: 1.55, margin: 0 }}>
        <code>apps/web</code> is alive. The prototype design canvas keeps running at{' '}
        <a href="http://localhost:8765/" style={{ color: '#5b6dff', textDecoration: 'none' }}>
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
          color: '#5b5b66',
          border: '1px solid #ececef',
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
  );
}
