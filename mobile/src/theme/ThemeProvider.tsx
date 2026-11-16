import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, Density, LightColors, Motion, Radius, Shadow, Spacing, Typography } from './tokens';
import type { BrandColors } from './branding';
import { BrandingColorsContext, useBrandingColors } from './BrandingContext';
export { useBrandingColors } from './BrandingContext';

type PaperPalette = { [Key in keyof typeof LightColors]: string };
export type AppearancePreference = 'system' | 'light' | 'dark';
export type AppearanceMode = 'light' | 'dark';

interface AppearancePreferenceContextValue {
  preference: AppearancePreference;
  resolvedScheme: AppearanceMode;
  isLoading: boolean;
  error: string | null;
  setPreference: (preference: AppearancePreference) => Promise<void>;
}

const APPEARANCE_STORAGE_KEY = 'transport-platform.appearance';
const AppearancePreferenceContext =
  React.createContext<AppearancePreferenceContextValue | null>(null);

function isAppearancePreference(value: string | null): value is AppearancePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function paperTheme(colors: PaperPalette, dark = false) {
  const baseTheme = dark ? MD3DarkTheme : MD3LightTheme;
  return { ...baseTheme, dark, roundness: Radius.md,
    fonts: configureFonts({ config: { fontFamily: Typography.fontBody } }),
    colors: { ...baseTheme.colors, primary: colors.primary, onPrimary: colors.onPrimary,
      primaryContainer: colors.primarySoft, onPrimaryContainer: colors.primaryDark,
      secondary: colors.secondary, onSecondary: colors.onSecondary,
      secondaryContainer: colors.secondarySoft, onSecondaryContainer: dark ? colors.secondary : colors.secondaryDark,
      background: colors.background, surface: colors.surface, surfaceVariant: colors.surfaceMuted,
      onSurface: colors.textPrimary, onSurfaceVariant: colors.textSecondary, outline: colors.border,
      error: colors.error, onError: colors.onError },
  };
}
// The tenant theme picker applies to web screens only. Mobile uses its own palette.
export const appTheme = paperTheme(LightColors);
export const resolvePaperPalette = (scheme: ReturnType<typeof useColorScheme>): PaperPalette =>
  scheme === 'dark' ? DarkColors : LightColors;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = React.useState<AppearancePreference>('system');
  const preferenceRef = React.useRef<AppearancePreference>('system');
  const settledPreferenceRef = React.useRef<AppearancePreference>('system');
  const saveQueueRef = React.useRef<Promise<void>>(Promise.resolve());
  const latestSaveIdRef = React.useRef(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
      .then((stored) => {
        if (active && isAppearancePreference(stored)) {
          settledPreferenceRef.current = stored;
          preferenceRef.current = stored;
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        if (active) {
          setError('Saved appearance preference could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = React.useCallback(async (nextPreference: AppearancePreference) => {
    const saveId = latestSaveIdRef.current + 1;
    latestSaveIdRef.current = saveId;
    preferenceRef.current = nextPreference;
    setPreferenceState(nextPreference);
    setError(null);
    const save = saveQueueRef.current.then(async () => {
      const previousPreference = settledPreferenceRef.current;
      try {
        await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, nextPreference);
        settledPreferenceRef.current = nextPreference;
      } catch (caughtError) {
        if (saveId === latestSaveIdRef.current) {
          preferenceRef.current = previousPreference;
          setPreferenceState(previousPreference);
          setError('Appearance preference could not be saved on this device.');
        }
        throw caughtError;
      }
    });
    saveQueueRef.current = save.catch(() => undefined);
    await save;
  }, []);

  const resolvedScheme: AppearanceMode = preference === 'system'
    ? systemScheme === 'dark' ? 'dark' : 'light'
    : preference;
  const paperColors = resolvePaperPalette(resolvedScheme);
  const theme = React.useMemo(
    () => paperTheme(paperColors, resolvedScheme === 'dark'),
    [paperColors, resolvedScheme],
  );
  const appearanceValue = React.useMemo(
    () => ({ preference, resolvedScheme, isLoading, error, setPreference }),
    [preference, resolvedScheme, isLoading, error, setPreference],
  );

  return (
    <AppearancePreferenceContext.Provider value={appearanceValue}>
      <BrandingColorsContext.Provider value={paperColors}>
        <PaperProvider theme={theme}>{children}</PaperProvider>
      </BrandingColorsContext.Provider>
    </AppearancePreferenceContext.Provider>
  );
}
export function useAppearancePreference() {
  const context = React.useContext(AppearancePreferenceContext);
  if (!context) {
    throw new Error('useAppearancePreference must be used within ThemeProvider.');
  }
  return context;
}
export function useAppThemeTokens() {
  return { colors: useBrandingColors(), spacing: Spacing, radius: Radius, typography: Typography, shadow: Shadow, density: Density, motion: Motion };
}

export function useThemedStyles<T>(createStyles: (colors: BrandColors) => T): T {
  const colors = useBrandingColors();
  return React.useMemo(() => createStyles(colors), [colors, createStyles]);
}
