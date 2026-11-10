import { ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { useAuth } from '@auth/AuthContext';
import { DashboardHeader } from '@components/DashboardHeader';
import { StatsGrid } from '@components/StatsGrid';
import { LoadingState } from '@components/LoadingState';
import { RequestError } from '@components/RequestError';
import { RideCard } from '@components/RideCard';
import { EmptyState } from '@components/EmptyState';
import { ActionRow } from '@components/ActionRow';
import { SectionHeader } from '@components/SectionHeader';
import { AppButton, AppCard } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
export default function DriverDashboard() {
  const { session } = useAuth(); const router = useRouter();
  const dashboard = useQuery({ queryKey: ['driver-dashboard'], queryFn: driverPortalApi.getDashboard });
  const trips = useQuery({ queryKey: ['driver-rides-next-assigned'], queryFn: () => driverPortalApi.searchRides({ page: 0, size: 20, fromDate: new Date(Date.now()-86400000).toISOString().slice(0,10), sortBy: 'scheduledPickupAt', sortDirection: 'ASC' }) });
  const upcoming = (trips.data?.items ?? []).filter(ride => ['ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','PICKED_UP'].includes(ride.status));
  const data = dashboard.data;
  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError) return <RequestError onRetry={() => void dashboard.refetch()} />;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={dashboard.isRefetching || trips.isRefetching} onRefresh={() => { void dashboard.refetch(); void trips.refetch(); }} />}>
    <DashboardHeader name={session?.identity.firstName?.trim() || 'Driver'} role="driver" />
    <StatsGrid items={[
      { label: 'Trips today', value: data?.ridesToday ?? '—', icon: 'calendar-today' },
      { label: 'Assigned trips', value: data?.assignedRides ?? '—', icon: 'car-outline' },
      { label: 'Active routes', value: data?.activeRoutesToday ?? '—', icon: 'map-marker-path' },
      { label: 'Compliance issues', value: data?.unresolvedComplianceIssues ?? '—', icon: 'shield-check-outline', warning: (data?.unresolvedComplianceIssues ?? 0)>0 },
    ]} />
    <SectionHeader title="Your next trips" subtitle="Open a trip for directions and pickup actions." />
    {trips.isLoading ? <AppCard><Text style={styles.copy}>Loading your assignments…</Text></AppCard> : trips.isError ? <AppCard><Text style={styles.copy}>Assignments couldn’t be loaded.</Text><AppButton label="Retry assignments" variant="outlined" onPress={() => void trips.refetch()} /></AppCard> : upcoming.length ? upcoming.slice(0,3).map(ride => <RideCard key={ride.id} ride={ride} onPress={() => router.push(`/(driver)/rides/${ride.id}`)} />) : <AppCard><EmptyState title="No upcoming assignments" description="Your assigned trips will appear here. Pull down to refresh." /></AppCard>}
    <AppButton label="View all trips" variant="outlined" rightIcon="arrow-right" onPress={() => router.push('/(driver)/rides')} />
    <SectionHeader title="Your workspace" />
    <ActionRow icon="car-outline" title="My vehicles" description="View your owned and assigned vehicles" onPress={() => router.push('/(driver)/vehicle')} />
    <ActionRow icon="map-marker-path" title="Route manifests" description="View your assigned routes and stops" onPress={() => router.push('/(driver)/routes')} />
    <ActionRow icon="file-document-outline" title="Documents & compliance" description="Review issues and upload required documents" onPress={() => router.push('/(driver)/compliance')} />
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxxl }, copy: { fontFamily: Typography.fontBody, color: Colors.textSecondary, lineHeight: 23 } });
