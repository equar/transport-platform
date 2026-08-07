import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { runtimeApi, type TenantBrandingRecord } from '@api/runtimeApi';
import { getCachedTenantBranding, setCachedTenantBranding } from '@auth/sessionStorage';
import { useEffect, useState } from 'react';
import { Colors, Spacing, Radius, Typography } from '@theme/tokens';

interface Props {
  tenantId: string | null | undefined;
}

export function TenantHeader({ tenantId }: Props) {
  const [cached, setCached] = useState<TenantBrandingRecord | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    if (!tenantId) {
      setCached(null);
      return;
    }
    getCachedTenantBranding(tenantId).then((raw) => {
      if (!mounted) return;
      if (!raw) {
        setCached(null);
        return;
      }
      try {
        setCached(JSON.parse(raw) as TenantBrandingRecord);
      } catch {
        setCached(null);
      }
    });
    return () => { mounted = false; };
  }, [tenantId]);

  const { data } = useQuery<TenantBrandingRecord | null>({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => (tenantId ? runtimeApi.getTenantBranding(tenantId) : Promise.resolve(null)),
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60 * 60,
  });

  // persist fetched branding to session cache
  useEffect(() => {
    if (tenantId && data) {
      setCachedTenantBranding(tenantId, JSON.stringify(data)).catch(() => {});
    }
  }, [tenantId, data]);

  const effective = data ?? cached ?? null;

  const name = effective?.displayName ?? null;
  const logo = effective?.logoUrl ?? null;

  // If tenantId is explicitly null -> show fallback text
  if (!tenantId) {
    return (
      <View style={styles.container} accessible accessibilityRole="header" accessibilityLabel="No tenant assigned">
        <View style={styles.fallbackLogo} />
        <Text style={styles.name}>No tenant assigned</Text>
      </View>
    );
  }

  if (!name && !logo) return null;

  return (
    <View style={styles.container} accessible accessibilityRole="header" accessibilityLabel={name ?? 'Tenant'}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
      ) : (
        <View style={styles.fallbackLogo} />
      )}
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: Radius.full ?? 18,
    backgroundColor: Colors.surface,
  },
  fallbackLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  name: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeMd,
    color: Colors.white,
    maxWidth: 220,
  },
});

export default TenantHeader;
