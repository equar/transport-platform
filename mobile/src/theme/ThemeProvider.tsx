import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import { DarkColors, Density, LightColors, Motion, Radius, Shadow, Spacing, Typography } from './tokens';
import type { BrandColors } from './branding';
import { BrandingColorsContext, useBrandingColors } from './BrandingContext';
export { useBrandingColors } from './BrandingContext';

function paperTheme(colors: BrandColors, dark = false) {
  const baseTheme = dark ? MD3DarkTheme : MD3LightTheme;
  return { ...baseTheme, dark, roundness: Radius.md,
    fonts: configureFonts({ config: { fontFamily: Typography.fontBody } }),
    colors: { ...baseTheme.colors, primary: colors.primary, onPrimary: '#ffffff',
      primaryContainer: colors.primarySoft, onPrimaryContainer: colors.primaryDark,
      secondary: colors.secondary, secondaryContainer: colors.secondarySoft, onSecondaryContainer: colors.secondaryDark,
      background: colors.background, surface: colors.surface, surfaceVariant: colors.surfaceMuted,
      onSurface: colors.textPrimary, onSurfaceVariant: colors.textSecondary, outline: colors.border, error: colors.error },
  };
}
// The tenant theme picker applies to web screens only. Mobile uses its own palette.
export const appTheme = paperTheme(LightColors);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const theme = React.useMemo(() => paperTheme(colors, scheme === 'dark'), [colors, scheme]);

  return <BrandingColorsContext.Provider value={colors}><PaperProvider theme={theme}>{children}</PaperProvider></BrandingColorsContext.Provider>;
}
export function useAppThemeTokens() {
  return { colors: useBrandingColors(), spacing: Spacing, radius: Radius, typography: Typography, shadow: Shadow, density: Density, motion: Motion };
}
