import { SupportContact } from '@components/SupportContact';
import { AppButton } from '@components/ui';
import { useRouter } from 'expo-router';
import { RequestError } from '@components/RequestError';
import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { AppCard, AppBadge } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';

export default function DriverVehiclePage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { data: profile, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverPortalApi.getProfile(),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <RequestError onRetry={() => void refetch()} />;
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
        <Text style={styles.vehicleName}>Your trip assignment</Text>
        <Text style={styles.cardCopy}>Vehicle details are confirmed by dispatch for each trip. We don’t have a separate vehicle assignment to display here.</Text>
        <AppButton label="View assigned trips" onPress={() => router.push('/(driver)/rides')} />
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Safety and Service</Text>
        <Text style={styles.cardCopy}>
          Contact your transport provider for maintenance notes, replacement assignments or pre-trip checklist updates.
        </Text>
      </AppCard>
      <SupportContact />
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
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
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
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  dataLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dataValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  cardCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
