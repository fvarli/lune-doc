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
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          marginBottom: '1.25rem',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <rect x="2" y="2" width="24" height="24" rx="7" fill="#5b6dff" />
          <path d="M19 2 L26 9 L19 9 Z" fill="#8893ff" />
          <path d="M8 7 H12 V17 H20 V21 H8 Z" fill="white" />
        </svg>
        Lunedoc
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
        Hello Lunedoc
      </h1>
      <p style={{ color: '#5b5b66', lineHeight: 1.55, margin: 0 }}>
        <code>apps/web</code> is alive. The prototype design canvas keeps running at{' '}
        <a href="http://localhost:8765/" style={{ color: '#5b6dff', textDecoration: 'none' }}>
          localhost:8765
        </a>
        . Phase 2 scaffold complete; UI port begins in Phase 3.
      </p>
    </main>
  );
}
