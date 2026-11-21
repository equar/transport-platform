import React from 'react';
import { Text } from 'react-native';
import * as ReactNative from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useBrandingColors, appTheme, paperTheme, resolvePaperPalette, useAppearancePreference } from './ThemeProvider';
import { RoleShell } from '@components/RoleShell';
import { AuthFrame } from '@components/AuthFrame';
import { DarkColors, LightColors } from './tokens';
function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  return channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}
function contrastRatio(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
let mockTenant: string | null = 'tenant-a';
let mockRoles = ['ROLE_DRIVER'];
let mockPage = '(driver)';
let mockPrimary = '#276442';
const mockRefetch = jest.fn();
jest.mock('@auth/AuthContext', () => ({ useAuth: () => ({ session: mockTenant ? { identity: { tenantId: mockTenant, roles: mockRoles, mustChangePassword: false } } : null }) }));
jest.mock('expo-router', () => ({ Redirect: () => null, useSegments: () => mockPage === '(driver)' ? ['(driver)'] : ['(driver)', 'rides'], useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }) }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@api/runtimeApi', () => ({ runtimeApi: { getTenantBranding: jest.fn() } }));
jest.mock('@auth/sessionStorage', () => ({ getCachedTenantBranding: jest.fn().mockResolvedValue(null), setCachedTenantBranding: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@tanstack/react-query', () => ({ useQuery: ({ queryKey }: { queryKey: string[] }) => ({
  data: queryKey[1] ? { displayName: queryKey[1] === 'tenant-a' ? 'Blue Harbor Mobility' : 'Forest Transit', primaryColor: mockPrimary, secondaryColor: '#173c2b', accentColor: '#8b641c' } : null,
  refetch: mockRefetch,
}) }));
jest.mock('react-native-paper', () => ({ PaperProvider: ({ children }: { children: React.ReactNode }) => children,
  MD3LightTheme: { colors: {} }, MD3DarkTheme: { colors: {} }, configureFonts: () => ({}) }));
const mockUseColorScheme = jest.spyOn(ReactNative, 'useColorScheme');
function Probe() { const colors = useBrandingColors(); return <Text>{`${String(colors.primary)}|${String(colors.secondaryDark)}|${String(colors.accent)}`}</Text>; }
function AppearanceLoadedProbe() {
  const { isLoading } = useAppearancePreference();
  return <Text testID="appearance-loaded">{isLoading ? 'loading' : 'ready'}</Text>;
}
async function waitForAppearanceLoad() {
  await waitFor(() => expect(screen.getByTestId('appearance-loaded').props.children).toBe('ready'));
}
function AppearanceProbe() {
  const { preference, resolvedScheme, setPreference } = useAppearancePreference();
  return <Text onPress={() => void setPreference('dark')}>{`${preference}|${resolvedScheme}`}</Text>;
}
function App() { return <ThemeProvider><RoleShell role="driver"><Probe /><AppearanceLoadedProbe /></RoleShell></ThemeProvider>; }
beforeEach(() => { mockRoles = ['ROLE_DRIVER']; mockTenant = 'tenant-a'; mockPage = '(driver)'; mockPrimary = '#276442'; mockUseColorScheme.mockReturnValue('light'); });
it('shows the tenant business name while keeping the mobile palette fixed through theme and account changes', async () => {
  const view = render(<App />);
  await waitForAppearanceLoad();
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
  expect(screen.queryByTestId('appearance-loaded')).toBeNull();
});
it('uses the dark palette when the device is in dark mode', async () => {
  mockUseColorScheme.mockReturnValue('dark');
  render(<ThemeProvider><Probe /><AppearanceLoadedProbe /></ThemeProvider>);
  await waitForAppearanceLoad();
  expect(screen.getByText(`${DarkColors.primary}|${DarkColors.secondaryDark}|${DarkColors.accent}`)).toBeTruthy();
  expect(resolvePaperPalette('dark')).toEqual(DarkColors);
  expect(resolvePaperPalette('light')).toEqual(LightColors);
});
it('keeps theme text, badges, and action labels readable in both palettes', () => {
  expect(LightColors.accent).toBe('#00796b');
  expect(DarkColors.accent).toBe('#4db6ac');
  for (const colors of [LightColors, DarkColors]) {
    for (const background of [colors.background, colors.surface, colors.surfaceMuted]) {
      expect(contrastRatio(colors.textPrimary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.textSecondary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.primary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.secondary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.accent, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.error, background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(colors.textInverse, colors.surfaceStrong)).toBeGreaterThanOrEqual(4.5);
    for (const [foreground, background] of [
      [colors.onPrimary, colors.primary],
      [colors.onSecondary, colors.secondary],
      [colors.onAccent, colors.accent],
      [colors.onError, colors.error],
      [colors.primaryDark, colors.primarySoft],
      [colors.statusActive, colors.successSoft],
      [colors.statusPending, colors.warningSoft],
      [colors.statusSuspended, colors.errorSoft],
      [colors.statusCompleted, colors.primarySoft],
      [colors.statusCancelled, colors.canvas],
      [colors.statusEnRoute, colors.primarySoft],
      [colors.warning, colors.warningSoft],
      [colors.info, colors.primarySoft],
    ]) {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  }
});
it('uses a readable foreground for the dark segmented-button selection', () => {
  const colors = paperTheme(DarkColors, true).colors;
  expect(colors.onSecondaryContainer).toBe(DarkColors.secondary);
  expect(contrastRatio(colors.onSecondaryContainer, colors.secondaryContainer)).toBeGreaterThanOrEqual(4.5);
});
it('persists and applies a selected appearance preference', async () => {
  render(<ThemeProvider><AppearanceProbe /><AppearanceLoadedProbe /></ThemeProvider>);
  await waitForAppearanceLoad();
  await waitFor(() => expect(screen.getByText('system|light')).toBeTruthy());

  fireEvent.press(screen.getByText('system|light'));

  await waitFor(() => expect(screen.getByText('dark|dark')).toBeTruthy());
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('transport-platform.appearance', 'dark');
});
it('serializes appearance saves and rolls back to the last saved value after consecutive failures', async () => {
  let rejectFirst!: (error: Error) => void;
  let rejectSecond!: (error: Error) => void;
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock)
    .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
      rejectFirst = reject;
    }))
    .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
      rejectSecond = reject;
    }));

  function SaveProbe() {
    const { preference, setPreference } = useAppearancePreference();
    return (
      <>
        <Text onPress={() => void setPreference('dark').catch(() => undefined)}>Choose dark</Text>
        <Text onPress={() => void setPreference('light').catch(() => undefined)}>Choose light</Text>
        <Text testID="selected-preference">{preference}</Text>
      </>
    );
  }

  render(<ThemeProvider><SaveProbe /><AppearanceLoadedProbe /></ThemeProvider>);
  await waitForAppearanceLoad();
  fireEvent.press(screen.getByText('Choose dark'));
  fireEvent.press(screen.getByText('Choose light'));
  expect(screen.getByTestId('selected-preference').props.children).toBe('light');
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1));

  rejectFirst(new Error('first save failed'));
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2));
  rejectSecond(new Error('second save failed'));
  await waitFor(() => expect(screen.getByTestId('selected-preference').props.children).toBe('system'));
});
it('shows the current page title on signed-in subpages', async () => {
  mockPage = 'rides'; render(<App />);
  await waitForAppearanceLoad();
  expect(screen.getByRole('header', { name: 'My Trips' })).toBeTruthy();
  expect(screen.getByText('My Trips')).toBeTruthy();
});
it('keeps the Bakaroo logo on the authentication frame', async () => {
  render(<ThemeProvider><AuthFrame title="Welcome back" description="Sign in"><Text>Login fields</Text></AuthFrame><AppearanceLoadedProbe /></ThemeProvider>);
  await waitForAppearanceLoad();
  expect(screen.getByLabelText('Bakaroo Transport logo')).toBeTruthy();
  expect(screen.queryByText('Blue Harbor Mobility')).toBeNull();
});

it('does not mount driver content for rider or guardian identities', async () => {
  function GuardedApp() {
    return <ThemeProvider><RoleShell role="driver"><Text testID="driver-content">Driver content</Text></RoleShell><AppearanceLoadedProbe /></ThemeProvider>;
  }
  mockRoles = ['ROLE_GUARDIAN'];
  const view = render(<GuardedApp />);
  // This probe remains outside the guarded subtree so async storage can settle.
  await waitForAppearanceLoad();
  expect(screen.queryByTestId('driver-content')).toBeNull();
  mockRoles = ['ROLE_RIDER'];
  view.rerender(<GuardedApp />);
  expect(screen.queryByTestId('driver-content')).toBeNull();
});
