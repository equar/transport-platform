import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function RiderProfilePage() {
  const { data: profile, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rider-profile'],
    queryFn: () => riderPortalApi.getProfile(),
  });

  if (isLoading) return <LoadingState />;
  if (!profile) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <SectionHeader title="Profile" subtitle={profile.code ?? profile.scopeType} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERSONAL</Text>
        <Row label="Name" value={`${profile.firstName} ${profile.lastName}`} />
        <Row label="Email" value={profile.email ?? '—'} />
        <Row label="Phone" value={profile.phone} />
        <Row label="Status" value={profile.status} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADDRESSES</Text>
        <Row label="Default Pickup" value={profile.defaultPickupAddress ?? '—'} />
        <Row label="Default Drop-off" value={profile.defaultDropoffAddress ?? '—'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMERGENCY CONTACT</Text>
        <Row label="Name" value={profile.emergencyContactName ?? '—'} />
        <Row label="Phone" value={profile.emergencyContactPhone ?? '—'} />
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
  sectionTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeXs, color: Colors.textSecondary, letterSpacing: 0.5, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: '#fafafa' },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  label: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, width: 110 },
  value: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
});
