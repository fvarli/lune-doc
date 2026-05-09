import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuotaBanner, isQuotaExceededError } from '@lunedoc/tools';
import {
  LunedocApiError,
  QuotaExceededError,
  type QuotaName,
  type QuotaExceededDetail,
} from '@lunedoc/api';
import { createTranslator } from '@lunedoc/i18n';

function makeQuotaError(
  quota: QuotaName,
  overrides: Partial<QuotaExceededDetail> = {},
): QuotaExceededError {
  return new QuotaExceededError({
    code: 'quota_exceeded',
    quota,
    limit: 20,
    used: 25,
    reset_at: '2026-05-09T12:00:00Z',
    ...overrides,
  });
}

describe('QuotaBanner', () => {
  const t = createTranslator('en');

  it('renders ocr_pages_daily message with used/limit suffix', () => {
    const err = makeQuotaError('ocr_pages_daily', { used: 21, limit: 20 });
    render(<QuotaBanner error={err} lang="en" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(t('quota_title'));
    expect(alert).toHaveTextContent(t('quota_ocr_pages_daily'));
    expect(alert).toHaveTextContent('(21/20)');
  });

  it('renders jobs_per_hour message without a used/limit suffix', () => {
    const err = makeQuotaError('jobs_per_hour', { used: 60, limit: 50 });
    render(<QuotaBanner error={err} lang="en" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(t('quota_jobs_per_hour'));
    expect(alert).not.toHaveTextContent('(60/50)');
  });

  it('renders concurrent_jobs message with used/limit suffix', () => {
    const err = makeQuotaError('concurrent_jobs', { used: 4, limit: 3 });
    render(<QuotaBanner error={err} lang="en" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      `${t('quota_concurrent_jobs')} (4/3)`,
    );
  });

  it('renders the resets_at line when reset_at parses to a valid Date', () => {
    const err = makeQuotaError('ocr_pages_daily', {
      reset_at: '2026-05-09T12:00:00Z',
    });
    render(<QuotaBanner error={err} lang="en" />);
    expect(screen.getByRole('alert')).toHaveTextContent(t('quota_resets_at'));
  });

  it('renders a disabled upgrade CTA and the placeholder helper text', () => {
    const err = makeQuotaError('ocr_pages_daily');
    render(<QuotaBanner error={err} lang="en" />);
    const cta = screen.getByRole('button', { name: t('quota_upgrade_cta') });
    expect(cta).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      t('quota_upgrade_soon'),
    );
  });

  it('isQuotaExceededError narrows correctly across truthy/falsy/wrong-type inputs', () => {
    const err = makeQuotaError('ocr_pages_daily');
    expect(isQuotaExceededError(err)).toBe(true);
    expect(isQuotaExceededError(new LunedocApiError(429, 'rate'))).toBe(false);
    expect(isQuotaExceededError(new Error('boom'))).toBe(false);
    expect(isQuotaExceededError(null)).toBe(false);
    expect(isQuotaExceededError(undefined)).toBe(false);
    expect(isQuotaExceededError({ quota: 'ocr_pages_daily' })).toBe(false);
  });
});
