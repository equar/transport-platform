import { ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { useAuth } from '@auth/AuthContext';
import { DashboardHeader } from '@components/DashboardHeader';
import { StatsGrid } from '@components/StatsGrid';
import { LoadingState } from '@components/LoadingState';
import { RequestError } from '@components/RequestError';
import { SectionHeader } from '@components/SectionHeader';
import { ActionRow } from '@components/ActionRow';
import { EmptyState } from '@components/EmptyState';
import { AppButton, AppBadge, AppCard } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';
import { isFinishedTrip } from '@utils/tripPresentation';
export function PassengerHomeScreen({ guardian = false }: { guardian?: boolean }) {
  const role = guardian ? 'guardian' : 'rider'; const router = useRouter(); const { session } = useAuth();
  const dashboard = useQuery({ queryKey: [`${role}-dashboard`], queryFn: riderPortalApi.getDashboard });
  const trips = useQuery({ queryKey: [`${role}-next-rides`], queryFn: () => riderPortalApi.searchRides({ page: 0, size: 20, fromDate: new Date(Date.now()-86400000).toISOString().slice(0,10), sortBy: 'scheduledPickupAt', sortDirection: 'ASC' }) });
  const next = trips.data?.items.find(ride => !isFinishedTrip(ride.status)); const data = dashboard.data;
  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError) return <RequestError onRetry={() => void dashboard.refetch()} />;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={dashboard.isRefetching || trips.isRefetching} onRefresh={() => { void dashboard.refetch(); void trips.refetch(); }} />}>
    <DashboardHeader name={session?.identity.firstName?.trim() || (guardian ? 'Guardian' : 'Rider')} role={role} />
    <StatsGrid items={[
      { label: 'Upcoming rides', value: data?.upcomingRideCount ?? '—', icon: 'calendar-clock-outline' },
      { label: 'Active rides', value: data?.activeRideCount ?? '—', icon: 'car-outline' },
      { label: guardian ? 'Linked riders' : 'Open invoices', value: guardian ? data?.linkedRiderCount ?? '—' : data?.openInvoiceCount ?? '—', icon: guardian ? 'account-group-outline' : 'receipt-text-outline' },
      { label: 'Unread alerts', value: data?.unreadNotifications ?? '—', icon: 'bell-outline' },
    ]} />
    <SectionHeader title={guardian ? 'Next family trip' : 'Your next trip'} subtitle="Pickup details and the latest trip status." />
    <AppCard style={styles.trip}>
      {trips.isLoading ? <Text style={styles.body}>Loading your trips…</Text> : trips.isError ? <><Text style={styles.body}>Trips couldn’t be loaded.</Text><AppButton label="Retry trips" variant="outlined" onPress={() => void trips.refetch()} /></> : next ? <>
        <AppBadge status={next.status} /><Text style={styles.title}>{formatShortDateTime(next.scheduledPickupAt)}</Text>
        {guardian && <Text style={styles.body}>{next.riderName}</Text>}
        <Text style={styles.caption}>PICKUP</Text><Text style={styles.body}>{next.pickupAddress || 'To be confirmed'}</Text>
        <Text style={styles.caption}>DROP-OFF</Text><Text style={styles.body}>{next.dropoffAddress || 'To be confirmed'}</Text>
        <AppButton label="View trip details" rightIcon="arrow-right" onPress={() => router.push(`/(${role})/rides/${next.id}` as never)} />
      </> : <EmptyState title="No upcoming trips" description="Trips assigned by your transport provider will appear here." />}
    </AppCard>
    <ActionRow icon="car-outline" title="All rides" description="Upcoming trips, status updates and history" onPress={() => router.push(`/(${role})/rides` as never)} />
    {guardian && <ActionRow icon="account-group-outline" title="Linked riders" description="View the riders you’re authorized to support" onPress={() => router.push('/(guardian)/riders')} />}
    <ActionRow icon="receipt-text-outline" title="Billing & payments" description="Review invoices and payment records" onPress={() => router.push(`/(${role})/billing` as never)} />
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  quickActions: { gap: Spacing.sm },
  helperText: { fontFamily: Typography.fontBody, color: Colors.textSecondary, fontSize: Typography.sizeSm, marginLeft: Spacing.xs },
  trip: { gap: Spacing.md },
  title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXl, color: Colors.textPrimary },
  body: { fontFamily: Typography.fontBody, color: Colors.textPrimary, fontSize: Typography.sizeMd, lineHeight: 23 },
  caption: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizeXs, color: Colors.textSecondary, marginTop: Spacing.sm, letterSpacing: 1 }
});
