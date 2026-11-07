import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PageHero } from './PageHero';
afterEach(cleanup);
it('renders the page identity and actions instead of discarding the heading', () => {
  render(<PageHero eyebrow="Operations" title="Ride management" description="Plan the next journey."><button>Add ride</button></PageHero>);
  expect(screen.getByRole('heading', { level: 1, name: 'Ride management' })).toBeTruthy();
  expect(screen.getByText('Plan the next journey.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Add ride' })).toBeTruthy();
});
