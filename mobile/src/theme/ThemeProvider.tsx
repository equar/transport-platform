import React, { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme, configureFonts } from 'react-native-paper';
import { useAuth } from '@auth/AuthContext';
import { runtimeApi, type TenantBrandingRecord } from '@api/runtimeApi';
import { getCachedTenantBranding, setCachedTenantBranding } from '@auth/sessionStorage';
import { Colors, Density, Motion, Radius, Shadow, Spacing, Typography } from './tokens';
import { brandingColors, type BrandColors } from './branding';

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
export const appTheme = paperTheme(Colors);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const tenantId = session?.identity.tenantId;
  const [cached, setCached] = useState<{ owner: string; value: TenantBrandingRecord } | null>(null);
  const { data, refetch } = useQuery({ queryKey: ['tenant-branding', tenantId],
    queryFn: () => runtimeApi.getTenantBranding(tenantId!), enabled: Boolean(tenantId),
    staleTime: 60_000, refetchInterval: 60_000 });
  useEffect(() => {
    let active = true; setCached(null);
    if (tenantId) void getCachedTenantBranding(tenantId).then(raw => {
      if (active && raw) { try { setCached({ owner: tenantId, value: JSON.parse(raw) }); } catch { setCached(null); } }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [tenantId]);
  useEffect(() => { if (tenantId && data) void setCachedTenantBranding(tenantId, JSON.stringify(data)).catch(() => undefined); }, [tenantId, data]);
  useEffect(() => {
    if (!tenantId) return;
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refetch(); });
    return () => listener.remove();
  }, [tenantId, refetch]);
  const colors = useMemo(() => brandingColors(tenantId ? data ?? (cached?.owner === tenantId ? cached.value : null) : null), [tenantId, data, cached]);
  const theme = useMemo(() => paperTheme(colors), [colors]);
  return <BrandingColorsContext.Provider value={colors}><PaperProvider theme={theme}>{children}</PaperProvider></BrandingColorsContext.Provider>;
}
export function useAppThemeTokens() {
  return { colors: useBrandingColors(), spacing: Spacing, radius: Radius, typography: Typography, shadow: Shadow, density: Density, motion: Motion };
}
