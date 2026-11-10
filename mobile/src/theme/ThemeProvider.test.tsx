import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, useBrandingColors, appTheme } from './ThemeProvider';
import { RoleShell } from '@components/RoleShell';
import { AuthFrame } from '@components/AuthFrame';
import { Colors } from './tokens';
let mockTenant: string | null = 'tenant-a';
let mockPage = '(driver)';
let mockPrimary = '#276442';
const mockRefetch = jest.fn();
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: mockTenant ? { identity: { tenantId: mockTenant } } : null }) }));
jest.mock('expo-router', () => ({ useSegments: () => mockPage === '(driver)' ? ['(driver)'] : ['(driver)', 'rides'], useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/runtimeApi', () => ({ runtimeApi: { getTenantBranding: jest.fn() } }));
jest.mock('@auth/sessionStorage', () => ({ getCachedTenantBranding: jest.fn().mockResolvedValue(null), setCachedTenantBranding: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: ({ queryKey }: { queryKey: string[] }) => ({
  data: queryKey[1] ? { displayName: queryKey[1] === 'tenant-a' ? 'Blue Harbor Mobility' : 'Forest Transit', primaryColor: mockPrimary, secondaryColor: '#173c2b', accentColor: '#8b641c' } : null,
  refetch: mockRefetch,
}) }));
jest.mock('react-native-paper', () => ({ PaperProvider: ({ children }: { children: React.ReactNode }) => children,
  MD3LightTheme: { colors: {} }, configureFonts: () => ({}) }));
function Probe() { const colors = useBrandingColors(); return <Text>{`${colors.primary}|${colors.secondaryDark}|${colors.accent}`}</Text>; }
function App() { return <ThemeProvider><RoleShell role="driver"><Probe /></RoleShell></ThemeProvider>; }
beforeEach(() => { mockTenant = 'tenant-a'; mockPage = '(driver)'; mockPrimary = '#276442'; });
it('shows the tenant business name while keeping the mobile palette fixed through theme and account changes', () => {
  const palette = `${Colors.primary}|${Colors.secondaryDark}|${Colors.accent}`;
  const view = render(<App />);
  expect(screen.getByRole('header', { name: 'Blue Harbor Mobility' })).toBeTruthy();
  expect(screen.queryByLabelText('Bakaroo Transport')).toBeNull();
  expect(screen.getByText(palette)).toBeTruthy();
  mockPrimary = '#5341a1'; view.rerender(<App />);
  expect(screen.getByText(palette)).toBeTruthy();
  expect(appTheme.colors.primary).toBe(Colors.primary);
  mockTenant = 'tenant-b'; view.rerender(<App />);
  expect(screen.getByText('Forest Transit')).toBeTruthy();
  expect(screen.queryByText('Blue Harbor Mobility')).toBeNull();
  expect(screen.getByText(palette)).toBeTruthy();
  mockTenant = null; view.rerender(<App />);
  expect(screen.queryByText('Forest Transit')).toBeNull();
  expect(screen.getByText(palette)).toBeTruthy();
});
it('shows the current page title on signed-in subpages', () => {
  mockPage = 'rides'; render(<App />);
  expect(screen.getByRole('header', { name: 'My Trips' })).toBeTruthy();
  expect(screen.getByText('My Trips')).toBeTruthy();
});
it('keeps the Bakaroo logo on the authentication frame', () => {
  render(<ThemeProvider><AuthFrame title="Welcome back" description="Sign in"><Text>Login fields</Text></AuthFrame></ThemeProvider>);
  expect(screen.getByLabelText('Bakaroo Transport logo')).toBeTruthy();
  expect(screen.queryByText('Blue Harbor Mobility')).toBeNull();
});
