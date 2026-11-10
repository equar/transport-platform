import React from 'react';
import { PaperProvider, MD3LightTheme, configureFonts } from 'react-native-paper';
import { Colors, Density, Motion, Radius, Shadow, Spacing, Typography } from './tokens';
import type { BrandColors } from './branding';
import { BrandingColorsContext, useBrandingColors } from './BrandingContext';
export { useBrandingColors } from './BrandingContext';

function paperTheme(colors: BrandColors) {
  return { ...MD3LightTheme, roundness: Radius.md,
    fonts: configureFonts({ config: { fontFamily: Typography.fontBody } }),
    colors: { ...MD3LightTheme.colors, primary: colors.primary, onPrimary: '#ffffff',
      primaryContainer: colors.primarySoft, onPrimaryContainer: colors.primaryDark,
      secondary: colors.secondary, secondaryContainer: colors.secondarySoft, onSecondaryContainer: colors.secondaryDark,
      background: colors.background, surface: colors.surface, surfaceVariant: colors.surfaceMuted,
      onSurface: colors.textPrimary, onSurfaceVariant: colors.textSecondary, outline: colors.border, error: colors.error },
  };
}
// The tenant theme picker applies to web screens only. Mobile uses its own palette.
export const appTheme = paperTheme(Colors);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <BrandingColorsContext.Provider value={Colors}><PaperProvider theme={appTheme}>{children}</PaperProvider></BrandingColorsContext.Provider>;
}
export function useAppThemeTokens() {
  return { colors: useBrandingColors(), spacing: Spacing, radius: Radius, typography: Typography, shadow: Shadow, density: Density, motion: Motion };
}
