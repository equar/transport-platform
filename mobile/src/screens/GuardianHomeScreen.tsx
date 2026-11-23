import { nextTripsPage, passengerNextStatuses } from '@api/nextTrips';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { guardianActiveRidesPage } from '@api/guardianHomeApi';
import { riderPortalApi } from '@api/riderPortalApi';
import { useAuth } from '@auth/AuthContext';
import { ActionRow } from '@components/ActionRow';
import { DashboardHeader } from '@components/DashboardHeader';
import { SectionHeader } from '@components/SectionHeader';
import { AppBadge, AppButton, AppCard } from '@components/ui';
import { foregroundTripRefreshOptions, useTripScreenVisible } from '@hooks/useTripScreenVisible';
import { useThemedStyles } from '@theme/ThemeProvider';
import { Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';
import { requestErrorMessage } from '@utils/requestError';
import { isFinishedTrip, isTrackableTrip, tripStatusLabel } from '@utils/tripPresentation';
import type { BrandColors } from '@theme/branding';

export function GuardianHomeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const visible = useTripScreenVisible();
  const styles = useThemedStyles(createStyles);
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.3;
  const active = useInfiniteQuery({
    queryKey: ['guardian-active-rides'],
    queryFn: ({ pageParam }) => guardianActiveRidesPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: last => last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    enabled: visible,
    ...foregroundTripRefreshOptions,
    staleTime: 0,
  });
  const trips = useQuery({
    queryKey: ['guardian-next-rides'],
    queryFn: () => nextTripsPage(riderPortalApi.searchRides, passengerNextStatuses),
    enabled: visible,
    ...foregroundTripRefreshOptions,
  });
  const activeRides = [...new Map((active.data?.pages.flatMap(page => page.items) ?? [])
    .filter(ride => isTrackableTrip(ride.status)).map(ride => [ride.id, ride])).values()];
  const next = trips.data?.items.find(ride => ride.status === 'DROPPED_OFF') ??
    trips.data?.items.find(ride => !isFinishedTrip(ride.status) && !isTrackableTrip(ride.status));
  const refresh = () => { void active.refetch(); void trips.refetch(); };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={active.isRefetching && !active.isFetchingNextPage || trips.isRefetching} onRefresh={refresh} />}>
    <DashboardHeader name={session?.identity.firstName?.trim() || 'Guardian'} role="guardian" />
    <SectionHeader title="Active rides" />
    {active.isPending ? <Text accessibilityLiveRegion="polite" style={styles.body}>Loading active rides…</Text> : active.isError ?
      <AppCard style={styles.card}><Text accessibilityRole="alert" style={styles.body}>{requestErrorMessage(active.error, 'Active rides couldn’t be loaded. Try again.')}</Text><AppButton label="Retry active rides" onPress={() => void active.refetch()} /></AppCard> : activeRides.length ?
      activeRides.map(ride => <AppCard key={ride.id} style={styles.card}>
        <View style={[styles.row, stacked && styles.stacked]}>
          <View style={styles.rider}><Text style={styles.name}>{ride.riderName || 'Rider'}</Text><Text style={styles.status}>{tripStatusLabel(ride.status)}</Text></View>
          <AppButton label="Track" accessibilityLabel={`Track ${ride.riderName || 'rider'} trip ${ride.rideNumber}`} accessibilityHint="Opens the trip’s live map" leftIcon="map-marker-radius-outline" fullWidth={stacked}
            onPress={() => router.push(`/(guardian)/rides/${ride.id}?track=1` as never)} />
        </View>
      </AppCard>) : <AppCard><Text style={styles.body}>No active rides right now.</Text></AppCard>}
    {active.hasNextPage && !active.isError ? <AppButton label="Load more active rides" variant="ghost" loading={active.isFetchingNextPage} onPress={() => { if (!active.isFetchingNextPage) void active.fetchNextPage(); }} /> : null}
    <SectionHeader title={next?.status === 'DROPPED_OFF' ? 'Confirm arrival' : 'Next trip'} />
    <AppCard style={styles.card}>
      {trips.isPending ? <Text style={styles.body}>Loading your trips…</Text> : trips.isError ? <><Text accessibilityRole="alert" style={styles.body}>{requestErrorMessage(trips.error, 'Upcoming trips couldn’t be loaded.')}</Text><AppButton label="Retry trips" variant="ghost" onPress={() => void trips.refetch()} /></> : next ? <>
        <Text style={styles.name}>{next.riderName}</Text><AppBadge status={next.status} />
        <Text style={styles.body}>{formatShortDateTime(next.scheduledPickupAt)}</Text>
        <AppButton label={next.status === 'DROPPED_OFF' ? 'Review delivery' : 'View trip details'} variant="ghost" onPress={() => router.push(`/(guardian)/rides/${next.id}` as never)} />
      </> : <Text style={styles.body}>No upcoming trips.</Text>}
    </AppCard>
    <ActionRow icon="car-outline" title="All trips" onPress={() => router.push('/(guardian)/rides')} />
    <ActionRow icon="account-group-outline" title="Linked riders" onPress={() => router.push('/(guardian)/riders')} />
    <ActionRow icon="receipt-text-outline" title="Invoices & payments" onPress={() => router.push('/(guardian)/billing')} />
  </ScrollView>;
}
const createStyles = (colors: BrandColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  card: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  rider: { flex: 1, minWidth: 0, gap: Spacing.xs },
  name: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeXl, color: colors.textPrimary },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: colors.textPrimary, lineHeight: 23 },
  status: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: colors.textSecondary, lineHeight: 23 },
});
