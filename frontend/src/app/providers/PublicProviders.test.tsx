import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { PublicProviders } from './PublicProviders';
import { HomePage } from '../../features/public/pages/HomePage';
import { PublicFooter } from '../../features/public/components/PublicFooter';
import { PublicHeader } from '../../features/public/components/PublicHeader';
const auth = vi.hoisted(() => ({ restoreSession: vi.fn() }));
vi.mock('../../features/auth/api/authApi', () => ({ authApi: auth }));
afterEach(cleanup);
it('renders public navigation without restoring a private session and keeps administration links out of the public experience', () => {
  render(<PublicProviders><MemoryRouter><PublicHeader /></MemoryRouter></PublicProviders>);
  expect(auth.restoreSession).not.toHaveBeenCalled();
  expect(screen.queryByRole('link', { name: /sign in|admin/i })).toBeNull();
  expect(screen.getByRole('link', { name: 'Platform' }).getAttribute('href')).toBe('/features');
});

it('offers no administration sign-in links anywhere on the public homepage or footer', () => {
  render(<PublicProviders><MemoryRouter><HomePage /><PublicFooter /></MemoryRouter></PublicProviders>);
  for (const link of screen.getAllByRole('link')) {
    expect(link.getAttribute('href')).not.toMatch(/admin\.|\/login/);
  }
});
