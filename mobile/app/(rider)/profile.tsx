import { AccountActions } from '@components/AccountActions';
import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { EmptyState } from '@components/EmptyState';
import { AppCard } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function RiderProfilePage() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['rider-profile'],
    queryFn: () => riderPortalApi.getProfile(),
  });

  if (isLoading) return <LoadingState />;

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
        <Text style={styles.heroTitle}>Profile</Text>
        <Text style={styles.heroName}>{profile ? `${profile.firstName} ${profile.lastName}` : 'Rider Account'}</Text>
      </View>

      {isError ? (
        <AppCard>
          <EmptyState
            actionLabel="Try again" onAction={() => void refetch()}
            title="Unable to load profile"
            description={error instanceof Error ? error.message : 'Pull to refresh and try again.'}
          />
        </AppCard>
      ) : !profile ? (
        <AppCard>
          <EmptyState
            title="Profile unavailable"
            description="No rider profile data was returned yet. Pull down to refresh."
          />
        </AppCard>
      ) : (
        <>
          <SectionHeader title="Passenger Details" subtitle={profile.code ?? profile.scopeType} />

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Personal</Text>
            <Row label="Name" value={`${profile.firstName} ${profile.lastName}`} />
            <Row label="Email" value={profile.email ?? '—'} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Status" value={profile.status} />
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Addresses</Text>
            <Row label="Default Pickup" value={profile.defaultPickupAddress ?? '—'} />
            <Row label="Default Drop-off" value={profile.defaultDropoffAddress ?? '—'} />
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Row label="Name" value={profile.emergencyContactName ?? '—'} />
            <Row label="Phone" value={profile.emergencyContactPhone ?? '—'} />
          </AppCard>
        </>
      )}
    <AccountActions />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  hero: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  heroName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  section: { gap: Spacing.sm },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, width: 110 },
  value: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
});
