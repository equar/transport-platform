import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { AppCard } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';

export default function DriverProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverPortalApi.getProfile(),
  });

  if (isLoading) return <LoadingState />;
  if (!profile) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Profile</Text>
        <Text style={styles.heroName}>{profile.firstName} {profile.lastName}</Text>
        <Text style={styles.heroMeta}>{profile.email ?? 'No email on file'}</Text>
      </View>

      <SectionHeader title="Driver Details" subtitle={profile.driverCode} />

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Row label="Name" value={`${profile.firstName} ${profile.lastName}`} />
        <Row label="Email" value={profile.email ?? '—'} />
        <Row label="Phone" value={profile.phone} />
        <Row label="Status" value={profile.status} />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Qualifications</Text>
        <Row label="License Exp." value={profile.licenseExpiryDate ?? '—'} />
        <Row label="Background" value={profile.backgroundCheckExpiryDate ?? '—'} />
        <Row label="Drug Test" value={profile.drugTestExpiryDate ?? '—'} />
        <Row label="Training" value={profile.trainingCompletionDate ?? '—'} />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <Row label="Name" value={profile.emergencyContactName ?? '—'} />
        <Row label="Phone" value={profile.emergencyContactPhone ?? '—'} />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <Text style={styles.note}>{profile.availabilitySummary || 'Not set'}</Text>
      </AppCard>

      <TouchableOpacity
        style={styles.vehicleButton}
        onPress={() => router.push('/(driver)/vehicle')}
        activeOpacity={0.88}
      >
        <Text style={styles.vehicleButtonText}>My Vehicle</Text>
      </TouchableOpacity>
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
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: 18,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.white,
  },
  heroName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.white,
  },
  heroMeta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.white,
    opacity: 0.9,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  note: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  vehicleButton: {
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  vehicleButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.white,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  label: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, width: 100 },
  value: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
});
