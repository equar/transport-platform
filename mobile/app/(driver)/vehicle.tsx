import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { AppCard, AppBadge } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';

export default function DriverVehiclePage() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverPortalApi.getProfile(),
  });

  if (isLoading) return <LoadingState />;
  if (!profile) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
          gap: isCompact ? Spacing.md : Spacing.lg,
        },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Vehicle</Text>
        <Text style={styles.heroSubtitle}>Assigned fleet details and readiness</Text>
      </View>

      <AppCard style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.vehicleName}>Fleet Assignment</Text>
          <AppBadge status="ACTIVE" label="Ready" />
        </View>
        <Row label="Vehicle Type" value="Van (Company Owned)" />
        <Row label="Plate Number" value="Assigned by dispatch" />
        <Row label="Capacity" value="16 seats" />
        <Row label="Fuel Type" value="Gasoline" />
        <Row label="Company" value={profile.email ?? 'Company transport operations'} />
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Safety and Service</Text>
        <Text style={styles.cardCopy}>
          Contact dispatch from the Messages tab for maintenance notes, replacement assignment, or pre-trip checklist updates.
        </Text>
      </AppCard>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  hero: {
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: 18,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.white,
  },
  heroSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.white,
    opacity: 0.9,
  },
  card: {
    gap: Spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  vehicleName: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  dataLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dataValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  cardCopy: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
