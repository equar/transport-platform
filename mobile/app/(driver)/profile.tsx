import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function DriverProfilePage() {
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
      <SectionHeader title="Profile" subtitle={profile.driverCode} />

      {/* Identity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERSONAL</Text>
        <Row label="Name" value={`${profile.firstName} ${profile.lastName}`} />
        <Row label="Email" value={profile.email ?? '—'} />
        <Row label="Phone" value={profile.phone} />
        <Row label="Status" value={profile.status} />
      </View>

      {/* Qualifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUALIFICATIONS</Text>
        <Row label="License Exp." value={profile.licenseExpiryDate ?? '—'} />
        <Row label="Background" value={profile.backgroundCheckExpiryDate ?? '—'} />
        <Row label="Drug Test" value={profile.drugTestExpiryDate ?? '—'} />
        <Row label="Training" value={profile.trainingCompletionDate ?? '—'} />
      </View>

      {/* Emergency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMERGENCY CONTACT</Text>
        <Row label="Name" value={profile.emergencyContactName ?? '—'} />
        <Row label="Phone" value={profile.emergencyContactPhone ?? '—'} />
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AVAILABILITY</Text>
        <Text style={styles.note}>{profile.availabilitySummary || 'Not set'}</Text>
      </View>
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
  section: { borderWidth: 1, borderColor: Colors.border },
  sectionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: '#fafafa',
  },
  note: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
    padding: Spacing.md,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  label: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, width: 100 },
  value: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
});
