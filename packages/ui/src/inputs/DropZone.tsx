import { useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

interface DropZoneProps {
  /** MIME type list passed to the underlying <input type="file">. */
  accept?: string;
  /** Soft client-side cap. Files larger than this are filtered out. */
  maxBytes?: number;
  /** Whether to allow selecting multiple files. */
  multiple?: boolean;
  /** Called with the list of accepted files (after maxBytes filter). */
  onFiles: (files: File[]) => void;
  /** Called with the list of rejected files (oversize). */
  onReject?: (files: File[]) => void;
  /** Disable interaction. */
  disabled?: boolean;
  /**
   * Visible label (uses i18n keys from the calling site, NOT inside DropZone,
   * so this primitive stays locale-agnostic). Renders the children where
   * the default helper text would otherwise go.
   */
  children?: ReactNode;
  /** Test ID hook. */
  testId?: string;
}

/**
 * Bare-bones drag-and-drop file picker. Uses the same visual conventions
 * as the rest of @lunedoc/ui (var(--line), var(--accent), etc.) but is
 * deliberately ungenerous on layout so the calling tool page can decide
 * how the surrounding flow looks.
 */
export function DropZone({
  accept,
  maxBytes,
  multiple = false,
  onFiles,
  onReject,
  disabled = false,
  children,
  testId,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  function handleFiles(rawList: FileList | null) {
    if (!rawList || rawList.length === 0) return;
    const all = Array.from(rawList);
    const accepted = maxBytes ? all.filter((f) => f.size <= maxBytes) : all;
    const rejected = maxBytes ? all.filter((f) => f.size > maxBytes) : [];
    if (rejected.length > 0) onReject?.(rejected);
    if (accepted.length > 0) onFiles(accepted);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    setHover(true);
  }

  function onDragLeave() {
    setHover(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  function onClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div
      data-testid={testId}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '32px 24px',
        border: `2px dashed ${hover ? 'var(--accent)' : 'var(--line)'}`,
        borderRadius: 12,
        background: hover ? 'var(--accent-soft, rgba(0,0,0,0.02))' : 'transparent',
        color: 'var(--ink)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 120ms ease, background 120ms ease',
        userSelect: 'none',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      {children}
    </div>
  );
}
