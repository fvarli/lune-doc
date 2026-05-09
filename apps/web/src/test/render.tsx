import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../auth/AuthContext';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  withAuth?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    withAuth = true,
    ...rest
  }: RenderWithProvidersOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    const inner = withAuth ? (
      <AuthProvider>{children}</AuthProvider>
    ) : (
      <>{children}</>
    );
    return <MemoryRouter initialEntries={[route]}>{inner}</MemoryRouter>;
  }
  return render(ui, { wrapper: Wrapper, ...rest });
}

export function makeUser() {
  return userEvent.setup();
}

export * from '@testing-library/react';
