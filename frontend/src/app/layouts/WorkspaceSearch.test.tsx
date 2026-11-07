import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { WorkspaceSearch } from './WorkspaceSearch';
const sections = [{ title: 'Operations', items: [{ label: 'Rides', description: 'Manage scheduled journeys', to: '/company/rides', icon: null }] }];
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
afterEach(cleanup);
it('opens with the keyboard shortcut and navigates to an available page', () => {
  render(<MemoryRouter><WorkspaceSearch sections={sections} /><Location /></MemoryRouter>);
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  fireEvent.change(screen.getByLabelText('Search pages and tools'), { target: { value: 'journeys' } });
  fireEvent.keyDown(screen.getByLabelText('Search pages and tools'), { key: 'Enter' });
  expect(screen.getByTestId('location').textContent).toBe('/company/rides');
});
it('shows an empty state without offering pages outside the supplied role navigation', () => {
  render(<MemoryRouter><WorkspaceSearch sections={sections} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Search workspace pages' }));
  fireEvent.change(screen.getByLabelText('Search pages and tools'), { target: { value: 'platform administration' } });
  expect(screen.getByText(/No matching pages/)).toBeTruthy();
  expect(screen.queryByText('Tenants')).toBeNull();
});
