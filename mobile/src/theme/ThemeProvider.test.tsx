import React from 'react';
import { Text } from 'react-native';
import * as ReactNative from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, useBrandingColors, appTheme, resolvePaperPalette } from './ThemeProvider';
import { RoleShell } from '@components/RoleShell';
import { AuthFrame } from '@components/AuthFrame';
import { DarkColors, LightColors } from './tokens';
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
  MD3LightTheme: { colors: {} }, MD3DarkTheme: { colors: {} }, configureFonts: () => ({}) }));
const mockUseColorScheme = jest.spyOn(ReactNative, 'useColorScheme');
function Probe() { const colors = useBrandingColors(); return <Text>{`${String(colors.primary)}|${String(colors.secondaryDark)}|${String(colors.accent)}`}</Text>; }
function App() { return <ThemeProvider><RoleShell role="driver"><Probe /></RoleShell></ThemeProvider>; }
beforeEach(() => { mockTenant = 'tenant-a'; mockPage = '(driver)'; mockPrimary = '#276442'; mockUseColorScheme.mockReturnValue('light'); });
it('shows the tenant business name while keeping the mobile palette fixed through theme and account changes', () => {
  const view = render(<App />);
  expect(screen.getByRole('header', { name: 'Blue Harbor Mobility' })).toBeTruthy();
  expect(screen.queryByLabelText('Bakaroo Transport')).toBeNull();
  expect(screen.getByText(`${LightColors.primary}|${LightColors.secondaryDark}|${LightColors.accent}`)).toBeTruthy();
  mockPrimary = '#5341a1'; view.rerender(<App />);
  expect(screen.getByText(`${LightColors.primary}|${LightColors.secondaryDark}|${LightColors.accent}`)).toBeTruthy();
  expect(appTheme.colors.primary).toBe(LightColors.primary);
  mockTenant = 'tenant-b'; view.rerender(<App />);
  expect(screen.getByText('Forest Transit')).toBeTruthy();
  expect(screen.queryByText('Blue Harbor Mobility')).toBeNull();
  expect(screen.getByText(`${LightColors.primary}|${LightColors.secondaryDark}|${LightColors.accent}`)).toBeTruthy();
  mockTenant = null; view.rerender(<App />);
  expect(screen.queryByText('Forest Transit')).toBeNull();
  expect(screen.getByText(`${LightColors.primary}|${LightColors.secondaryDark}|${LightColors.accent}`)).toBeTruthy();
});
it('uses the dark palette when the device is in dark mode', () => {
  mockUseColorScheme.mockReturnValue('dark');
  render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText(`${DarkColors.primary}|${DarkColors.secondaryDark}|${DarkColors.accent}`)).toBeTruthy();
  expect(resolvePaperPalette('dark')).toEqual(DarkColors);
  expect(resolvePaperPalette('light')).toEqual(LightColors);
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
