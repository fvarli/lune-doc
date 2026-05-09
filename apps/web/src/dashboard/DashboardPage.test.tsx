import { describe, it, expect, vi } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { LunedocApiError } from '@lunedoc/api';
import type {
  MeFileItem,
  MeFilesResponse,
  MeJobItem,
  MeJobsResponse,
  MeUsageResponse,
  TokenResponse,
} from '@lunedoc/api';
import { createTranslator } from '@lunedoc/i18n';
import type { Lang } from '@lunedoc/ui';
import { DashboardPage } from './DashboardPage';
import { getMockClient } from '../test/mock-api';
import {
  renderWithProviders,
  screen,
  waitFor,
  makeUser,
  within,
} from '../test/render';

const REFRESH_KEY = 'lunedoc.auth.refresh_token';

function tokenResponse(): TokenResponse {
  return {
    access_token: 'at-1',
    refresh_token: 'rt-2',
    token_type: 'Bearer',
    expires_in: 900,
    user: { id: 'u1', email: 'user@example.com' },
  };
}

function emptyUsage(overrides: Partial<MeUsageResponse> = {}): MeUsageResponse {
  return {
    tier: 'free',
    total_files: 0,
    total_jobs: 0,
    jobs_by_status: {},
    jobs_by_tool: {},
    ocr_pages_used_today: 0,
    ...overrides,
  };
}

function emptyJobs(): MeJobsResponse {
  return { items: [], limit: 20, offset: 0, total: 0 };
}

function emptyFiles(): MeFilesResponse {
  return { items: [], limit: 20, offset: 0, total: 0 };
}

function makeJob(id: string): MeJobItem {
  return {
    job_id: id,
    tool: 'compress',
    status: 'done',
    input_file_ids: [],
    output_file_ids: [],
    error: null,
    result_meta: null,
    created_at: '2026-05-09T10:00:00Z',
    updated_at: '2026-05-09T10:00:00Z',
  };
}

function makeFile(id: string): MeFileItem {
  return {
    file_id: id,
    name: `${id}.pdf`,
    mime: 'application/pdf',
    size: 1234,
    expires_at: '2026-05-09T11:00:00Z',
    created_at: '2026-05-09T10:00:00Z',
  };
}

function jobsPage(items: MeJobItem[], offset = 0): MeJobsResponse {
  return { items, limit: 20, offset, total: items.length };
}

function filesPage(items: MeFileItem[], offset = 0): MeFilesResponse {
  return { items, limit: 20, offset, total: items.length };
}

function seedAuthenticated() {
  localStorage.setItem(REFRESH_KEY, 'rt-1');
  getMockClient().refreshAuth.mockResolvedValueOnce(tokenResponse());
}

function renderDashboard(lang: Lang = 'en') {
  const setLang = vi.fn();
  const route = lang === 'en' ? '/dashboard' : `/${lang}/dashboard`;
  const signinPath = lang === 'en' ? '/signin' : `/${lang}/signin`;
  return renderWithProviders(
    <Routes>
      <Route
        path={route}
        element={<DashboardPage lang={lang} setLang={setLang} />}
      />
      <Route
        path={signinPath}
        element={<div data-testid="signin-route" />}
      />
      <Route path="*" element={<div data-testid="other-route" />} />
    </Routes>,
    { route, withAuth: true },
  );
}

describe('DashboardPage', () => {
  it('redirects unauthenticated users to the localized /signin route', async () => {
    renderDashboard('tr');
    await waitFor(() =>
      expect(screen.getByTestId('signin-route')).toBeInTheDocument(),
    );
    expect(getMockClient().getMeUsage).not.toHaveBeenCalled();
  });

  it('loads usage, jobs, and files for an authenticated user', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage.mockResolvedValueOnce(
      emptyUsage({ total_files: 3, total_jobs: 5, ocr_pages_used_today: 2 }),
    );
    getMockClient().getMeJobs.mockResolvedValueOnce(emptyJobs());
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    await waitFor(() =>
      expect(getMockClient().getMeUsage).toHaveBeenCalledWith('at-1'),
    );
    expect(getMockClient().getMeJobs).toHaveBeenCalledWith('at-1', {
      limit: 20,
      offset: 0,
    });
    expect(getMockClient().getMeFiles).toHaveBeenCalledWith('at-1', {
      limit: 20,
      offset: 0,
    });
    expect(
      await screen.findByRole('heading', { name: t('dashboard_title') }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(t('dashboard_no_jobs')),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(t('dashboard_no_files')),
    ).toBeInTheDocument();
  });

  it('renders empty-state cards when there are no jobs or files', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs.mockResolvedValueOnce(emptyJobs());
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    expect(
      await screen.findByText(t('dashboard_no_jobs')),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(t('dashboard_no_files')),
    ).toBeInTheDocument();
  });

  it('shows the error banner with a retry button when a fetch fails, and retries on click', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage
      .mockRejectedValueOnce(new LunedocApiError(500, 'boom'))
      .mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs.mockResolvedValue(emptyJobs());
    getMockClient().getMeFiles.mockResolvedValue(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(t('dashboard_error'));

    const user = makeUser();
    await user.click(
      within(alert).getByRole('button', { name: t('dashboard_retry') }),
    );

    await waitFor(() =>
      expect(getMockClient().getMeUsage).toHaveBeenCalledTimes(2),
    );
  });

  it('renders the OCR meter as used / 20', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage.mockResolvedValueOnce(
      emptyUsage({ ocr_pages_used_today: 5 }),
    );
    getMockClient().getMeJobs.mockResolvedValueOnce(emptyJobs());
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    const label = await screen.findByText(t('dashboard_ocr_quota_label'));
    const card = label.closest('.pl-card');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText('5')).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText('/ 20')).toBeInTheDocument();
  });

  it('shows the quota warning block when the OCR usage reaches the daily limit', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage.mockResolvedValueOnce(
      emptyUsage({ ocr_pages_used_today: 20 }),
    );
    getMockClient().getMeJobs.mockResolvedValueOnce(emptyJobs());
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(t('quota_title'));
    expect(status).toHaveTextContent(t('quota_ocr_pages_daily'));
    expect(status).toHaveTextContent(t('quota_upgrade_soon'));
  });

  it('renders result_meta as JSON inside a details disclosure when present', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs.mockResolvedValueOnce({
      items: [
        {
          job_id: 'j1',
          tool: 'compress',
          status: 'done',
          input_file_ids: [],
          output_file_ids: [],
          error: null,
          result_meta: { reduction_pct: 42 },
          created_at: '2026-05-09T10:00:00Z',
          updated_at: '2026-05-09T10:00:30Z',
        },
      ],
      limit: 20,
      offset: 0,
      total: 1,
    });
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    const summary = await screen.findByText(t('dashboard_result_meta'));
    expect(summary).toBeInTheDocument();
    expect(screen.getByText(/reduction_pct/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('never renders an owner_token_hash field on the dashboard', async () => {
    seedAuthenticated();
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs.mockResolvedValueOnce({
      items: [
        {
          job_id: 'j1',
          tool: 'merge',
          status: 'done',
          input_file_ids: [],
          output_file_ids: [],
          error: null,
          result_meta: null,
          created_at: '2026-05-09T10:00:00Z',
          updated_at: '2026-05-09T10:00:00Z',
        },
      ],
      limit: 20,
      offset: 0,
      total: 1,
    });
    getMockClient().getMeFiles.mockResolvedValueOnce({
      items: [
        {
          file_id: 'f1',
          name: 'doc.pdf',
          mime: 'application/pdf',
          size: 1234,
          expires_at: '2026-05-09T11:00:00Z',
          created_at: '2026-05-09T10:00:00Z',
        },
      ],
      limit: 20,
      offset: 0,
      total: 1,
    });

    renderDashboard('en');
    const t = createTranslator('en');
    await screen.findByRole('heading', { name: t('dashboard_title') });
    await waitFor(() =>
      expect(getMockClient().getMeJobs).toHaveBeenCalled(),
    );

    expect(document.body.textContent).not.toMatch(/owner_token_hash/i);
  });

  it('appends rows when "Load more jobs" is clicked', async () => {
    seedAuthenticated();
    const firstPage = Array.from({ length: 20 }, (_, i) => makeJob(`j${i}`));
    const secondPage = Array.from({ length: 5 }, (_, i) => makeJob(`j${20 + i}`));
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs
      .mockResolvedValueOnce(jobsPage(firstPage))
      .mockResolvedValueOnce(jobsPage(secondPage, 20));
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    const loadMore = await screen.findByRole('button', {
      name: t('dashboard_load_more_jobs'),
    });
    const jobsSection = sectionFor(t('dashboard_recent_jobs'));
    expect(within(jobsSection).getAllByRole('listitem')).toHaveLength(20);

    const user = makeUser();
    await user.click(loadMore);

    await waitFor(() =>
      expect(within(jobsSection).getAllByRole('listitem')).toHaveLength(25),
    );
    expect(getMockClient().getMeJobs).toHaveBeenLastCalledWith('at-1', {
      limit: 20,
      offset: 20,
    });
    expect(
      screen.queryByRole('button', { name: t('dashboard_load_more_jobs') }),
    ).not.toBeInTheDocument();
  });

  it('appends rows when "Load more files" is clicked', async () => {
    seedAuthenticated();
    const firstPage = Array.from({ length: 20 }, (_, i) => makeFile(`f${i}`));
    const secondPage = Array.from({ length: 3 }, (_, i) => makeFile(`f${20 + i}`));
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs.mockResolvedValueOnce(emptyJobs());
    getMockClient().getMeFiles
      .mockResolvedValueOnce(filesPage(firstPage))
      .mockResolvedValueOnce(filesPage(secondPage, 20));

    renderDashboard('en');
    const t = createTranslator('en');

    const loadMore = await screen.findByRole('button', {
      name: t('dashboard_load_more_files'),
    });
    const filesSection = sectionFor(t('dashboard_recent_files'));
    expect(within(filesSection).getAllByRole('listitem')).toHaveLength(20);

    const user = makeUser();
    await user.click(loadMore);

    await waitFor(() =>
      expect(within(filesSection).getAllByRole('listitem')).toHaveLength(23),
    );
    expect(getMockClient().getMeFiles).toHaveBeenLastCalledWith('at-1', {
      limit: 20,
      offset: 20,
    });
    expect(
      screen.queryByRole('button', { name: t('dashboard_load_more_files') }),
    ).not.toBeInTheDocument();
  });

  it('hides the load-more buttons when the initial page is shorter than the limit', async () => {
    seedAuthenticated();
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(`j${i}`));
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`f${i}`));
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs.mockResolvedValueOnce(jobsPage(jobs));
    getMockClient().getMeFiles.mockResolvedValueOnce(filesPage(files));

    renderDashboard('en');
    const t = createTranslator('en');

    await screen.findByRole('heading', { name: t('dashboard_title') });
    await waitFor(() => {
      const jobsSection = sectionFor(t('dashboard_recent_jobs'));
      expect(within(jobsSection).getAllByRole('listitem')).toHaveLength(5);
    });
    const filesSection = sectionFor(t('dashboard_recent_files'));
    expect(within(filesSection).getAllByRole('listitem')).toHaveLength(5);
    expect(
      screen.queryByRole('button', { name: t('dashboard_load_more_jobs') }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('dashboard_load_more_files') }),
    ).not.toBeInTheDocument();
  });

  it('preserves rendered jobs and shows an inline retry when load-more fails', async () => {
    seedAuthenticated();
    const firstPage = Array.from({ length: 20 }, (_, i) => makeJob(`j${i}`));
    const recoveredPage = Array.from({ length: 3 }, (_, i) => makeJob(`j${20 + i}`));
    getMockClient().getMeUsage.mockResolvedValueOnce(emptyUsage());
    getMockClient().getMeJobs
      .mockResolvedValueOnce(jobsPage(firstPage))
      .mockRejectedValueOnce(new LunedocApiError(500, 'boom'))
      .mockResolvedValueOnce(jobsPage(recoveredPage, 20));
    getMockClient().getMeFiles.mockResolvedValueOnce(emptyFiles());

    renderDashboard('en');
    const t = createTranslator('en');

    const loadMore = await screen.findByRole('button', {
      name: t('dashboard_load_more_jobs'),
    });
    const jobsSection = sectionFor(t('dashboard_recent_jobs'));
    expect(within(jobsSection).getAllByRole('listitem')).toHaveLength(20);

    const user = makeUser();
    await user.click(loadMore);

    expect(
      await screen.findByText(t('dashboard_load_more_failed')),
    ).toBeInTheDocument();
    expect(within(jobsSection).getAllByRole('listitem')).toHaveLength(20);
    expect(
      screen.queryByRole('button', { name: t('dashboard_load_more_jobs') }),
    ).not.toBeInTheDocument();

    await user.click(
      within(jobsSection).getByRole('button', { name: t('dashboard_retry') }),
    );

    await waitFor(() =>
      expect(within(jobsSection).getAllByRole('listitem')).toHaveLength(23),
    );
    expect(
      screen.queryByText(t('dashboard_load_more_failed')),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('dashboard_load_more_jobs') }),
    ).not.toBeInTheDocument();
  });
});

function sectionFor(headingText: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: headingText });
  const section = heading.closest('section');
  if (!section) throw new Error(`No <section> ancestor for heading: ${headingText}`);
  return section as HTMLElement;
}
