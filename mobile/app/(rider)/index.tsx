import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { MetricTile } from '@components/MetricTile';
import { SectionHeader } from '@components/SectionHeader';
import { LoadingState } from '@components/LoadingState';
import { useAuth } from '@auth/AuthContext';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function RiderDashboard() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderPortalApi.getDashboard(),
  });

  if (isLoading) return <LoadingState />;

  const name = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(' ') || 'Rider';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Text style={styles.signOut} onPress={signOut}>Sign out</Text>
      </View>

      <SectionHeader title="Overview" />

      <View style={styles.metricGrid}>
        <MetricTile label="Upcoming Rides" value={data?.upcomingRideCount ?? 0} accent />
        <MetricTile label="Active Rides" value={data?.activeRideCount ?? 0} />
        {data?.scopeType === 'GUARDIAN' ? (
          <MetricTile label="Linked Riders" value={data?.linkedRiderCount ?? 0} />
        ) : (
          <MetricTile label="Unread Alerts" value={data?.unreadNotifications ?? 0} />
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.action} onPress={() => router.push('/(rider)/rides')}>
          View my rides →
        </Text>
        {data?.scopeType === 'GUARDIAN' ? (
          <Text style={styles.action} onPress={() => router.push('/(guardian)/riders')}>
            Manage riders →
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  name: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.textPrimary },
  signOut: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary, textDecorationLine: 'underline' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickActions: { gap: Spacing.sm },
  action: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeMd, color: Colors.primary, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
});
