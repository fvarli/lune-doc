interface PdfThumbProps {
  w?: number;
  h?: number;
  page?: number | null;
}

// File-card placeholder showing a "PDF page" thumbnail with three short
// content lines. When `page` is provided, shows a numbered badge in the
// bottom-right corner; otherwise shows a "PDF" type chip.
export function PdfThumb({ w = 56, h = 72, page = null }: PdfThumbProps) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: 'var(--bg-elev)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 4, borderRadius: 2, background: 'var(--bg-sunken)' }} />
      <div style={{ position: 'absolute', top: 18, left: 8, right: 18, height: 3, borderRadius: 2, background: 'var(--bg-sunken)' }} />
      <div style={{ position: 'absolute', top: 26, left: 8, right: 12, height: 3, borderRadius: 2, background: 'var(--bg-sunken)' }} />
      <div style={{ position: 'absolute', top: 34, left: 8, right: 22, height: 3, borderRadius: 2, background: 'var(--bg-sunken)' }} />
      {page != null ? (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'var(--fg-subtle)',
            background: 'var(--bg-muted)',
            padding: '1px 5px',
            borderRadius: 3,
            border: '1px solid var(--line)',
          }}
        >
          {page}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            fontSize: 8,
            fontFamily: 'var(--font-mono)',
            color: 'var(--fg-subtle)',
            background: 'var(--bg-muted)',
            padding: '1px 4px',
            borderRadius: 3,
            border: '1px solid var(--line)',
          }}
        >
          PDF
        </div>
      )}
    </div>
  );
}
