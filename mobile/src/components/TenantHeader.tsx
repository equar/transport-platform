import { useBrandingColors } from '@theme/BrandingContext';
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTenantIdentity } from '@hooks/useTenantIdentity';
import { Colors, Spacing, Radius, Typography } from '@theme/tokens';

interface Props {
  tenantId: string | null | undefined;
  variant?: 'inline' | 'appHeader';
  pageTitle?: string;
}

export function TenantHeader({ tenantId, variant = 'inline', pageTitle }: Props) {
  const colors = useBrandingColors();
  const effective = useTenantIdentity(tenantId);

  const name = effective?.displayName ?? null;
  const logo = effective?.logoUrl ?? null;

  if (variant === 'appHeader') {
    const businessName = name?.trim() || (tenantId ? 'Your transport provider' : 'No tenant assigned');
    return <View style={styles.appHeader} accessible accessibilityRole="header" accessibilityLabel={pageTitle ? `${businessName}, ${pageTitle}` : businessName}>
      <Text style={styles.businessName} numberOfLines={2} ellipsizeMode="tail">{businessName}</Text>
      {pageTitle ? <Text style={styles.pageTitle} numberOfLines={1}>{pageTitle}</Text> : null}
    </View>;
  }

  // If tenantId is explicitly null -> show fallback text
  if (!tenantId) {
    return (
      <View style={styles.container} accessible accessibilityRole="header" accessibilityLabel="No tenant assigned">
        <View style={[styles.fallbackLogo, { backgroundColor: colors.primary }]} />
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
        <View style={[styles.fallbackLogo, { backgroundColor: colors.primary }]} />
      )}
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appHeader: { alignItems: 'center', width: '100%', gap: 2 },
  businessName: { fontFamily: Typography.fontBodyBold, fontSize: 18, lineHeight: 23, color: Colors.white, textAlign: 'center' },
  pageTitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXs, color: Colors.onPrimaryMuted, textAlign: 'center' },
  container: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 18,
    height: 18,
    borderRadius: Radius.full ?? 18,
    backgroundColor: Colors.primarySoft,
  },
  fallbackLogo: {
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: Colors.primarySoft,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
});

export default TenantHeader;
