import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { RoleShell } from '../RoleShell';

let mockRole = 'driver';
let mockPage = 'profile';
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: { identity: { tenantId: 'tenant-a', roles: [`ROLE_${mockRole.toUpperCase()}`] } } }) }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useSegments: () => [`(${mockRole})`, mockPage],
  Redirect: () => { const NativeText = jest.requireActual('react-native').Text; return <NativeText>Redirected</NativeText>; },
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('../TenantHeader', () => {
  const NativeText = jest.requireActual('react-native').Text;
  return { TenantHeader: ({ pageTitle }: { pageTitle?: string }) => <NativeText accessibilityRole="header">{pageTitle ?? 'Harbor Transit'}</NativeText> };
});

it.each(['driver', 'guardian', 'rider'] as const)('shows a single neutral profile title for %s', role => {
  mockRole = role; mockPage = 'profile';
  render(<RoleShell role={role}><Text>Account details</Text></RoleShell>);
  expect(screen.getAllByRole('header')).toHaveLength(1);
  expect(screen.getByRole('header', { name: 'Profile' })).toBeTruthy();
  expect(screen.queryByText(/^(Driver|Guardian|Rider)$/)).toBeNull();
  expect(screen.getByText('Account details')).toBeTruthy();
});
it('retains the provider identity on home and prevents access to another role', () => {
  mockRole = 'guardian'; mockPage = 'index';
  const view = render(<RoleShell role="guardian"><Text>Active rides</Text></RoleShell>);
  expect(screen.getByRole('header', { name: 'Harbor Transit' })).toBeTruthy();
  view.rerender(<RoleShell role="driver"><Text>Private assignments</Text></RoleShell>);
  expect(screen.getByText('Redirected')).toBeTruthy();
  expect(screen.queryByText('Private assignments')).toBeNull();
});
