import React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Colors, Radius } from './tokens';

const appTheme = {
  ...MD3LightTheme,
  roundness: Radius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceMuted,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    error: Colors.error,
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <PaperProvider theme={appTheme}>{children}</PaperProvider>;
}

export { appTheme };
