import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, useBrandingColors } from './ThemeProvider';
let mockTenant: string | null = 'tenant-a';
const mockRefetch = jest.fn();
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: mockTenant ? { identity: { tenantId: mockTenant } } : null }) }));
jest.mock('@api/runtimeApi', () => ({ runtimeApi: { getTenantBranding: jest.fn() } }));
jest.mock('@auth/sessionStorage', () => ({ getCachedTenantBranding: jest.fn().mockResolvedValue(null), setCachedTenantBranding: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: ({ queryKey }: { queryKey: string[] }) => ({
  data: queryKey[1] === 'tenant-a' ? { primaryColor: '#276442' } : queryKey[1] === 'tenant-b' ? { primaryColor: '#5341a1' } : null,
  refetch: mockRefetch,
}) }));
jest.mock('react-native-paper', () => ({ PaperProvider: ({ children }: { children: React.ReactNode }) => children,
  MD3LightTheme: { colors: {} }, configureFonts: () => ({}) }));
function Probe() { return <Text>{useBrandingColors().primary}</Text>; }
it('switches palettes with the account and resets to default on sign out', () => {
  const view = render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('#276442')).toBeTruthy();
  mockTenant = 'tenant-b'; view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('#5341a1')).toBeTruthy(); expect(screen.queryByText('#276442')).toBeNull();
  mockTenant = null; view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('#214e82')).toBeTruthy();
});
