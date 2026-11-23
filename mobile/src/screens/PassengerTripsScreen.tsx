import { foregroundTripRefreshOptions, useTripScreenVisible } from '@hooks/useTripScreenVisible';
import { isFinishedTrip, isTrackableTrip } from '@utils/tripPresentation';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { RequestError } from '@components/RequestError';
import React from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import type { RiderPortalRideRecord } from '@api/riderPortalApi';
import { AppBadge, AppCard, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

type RideSegment = 'today' | 'history';

export function PassengerTripsScreen({ role }: { role: 'rider' | 'guardian' }) {
  const visible = useTripScreenVisible();
  const styles = useThemedStyles(createStyles);
	const router = useRouter();
	const { width } = useWindowDimensions();
	const isCompact = width < 380;
	const [segment, setSegment] = React.useState<RideSegment>('today');
	const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useInfiniteQuery({
		queryKey: [`${role}-rides`, segment],
    enabled: visible,
    ...foregroundTripRefreshOptions,
    refetchInterval: segment === 'history' ? false : foregroundTripRefreshOptions.refetchInterval,
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			riderPortalApi.searchRides({
				page: pageParam,
				size: 20,
        view: segment === 'history' ? 'HISTORY' : 'UPCOMING',
				sortBy: 'scheduledPickupAt', sortDirection: segment === 'history' ? 'DESC' : 'ASC',
			}),
		getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
	});

	if (isLoading) return <LoadingState />;
  if (isError && !data) return <RequestError error={error} onRetry={() => void refetch()} />;

	const rides = [...new Map((data?.pages.flatMap(p => p.items) ?? []).map(ride => [ride.id, ride])).values()];
	const filtered = rides.filter(ride => segment === 'today' ? !isFinishedTrip(ride.status) : isFinishedTrip(ride.status));

	return (
		<View style={styles.container}>
			<View style={styles.headerCard}>
				<View style={styles.segmentRow}>
					<TouchableOpacity
						style={[styles.segmentButton, segment === 'today' ? styles.segmentSelected : undefined]}
						accessibilityRole="tab" accessibilityState={{ selected: segment === 'today' }} onPress={() => setSegment('today')}
						activeOpacity={0.85}
					>
						<Text style={[styles.segmentLabel, segment === 'today' ? styles.segmentLabelSelected : undefined]}>Upcoming</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.segmentButton, segment === 'history' ? styles.segmentSelected : undefined]}
						accessibilityRole="tab" accessibilityState={{ selected: segment === 'history' }} onPress={() => setSegment('history')}
						activeOpacity={0.85}
					>
						<Text style={[styles.segmentLabel, segment === 'history' ? styles.segmentLabelSelected : undefined]}>History</Text>
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				data={filtered}
				keyExtractor={(r) => String(r.id)}
				renderItem={({ item }) => <RideCard item={item} onPress={() => router.push(`/(${role})/rides/${item.id}`)} onTrack={() => router.push(`/(${role})/rides/${item.id}?track=1` as never)} />}
				ItemSeparatorComponent={() => <View style={styles.sep} />}
				ListEmptyComponent={<EmptyState
          title={role === 'guardian' ? 'No ride records' : hasNextPage ? segment === 'today' ? 'No upcoming trips on this page' : 'No finished trips on this page' : segment === 'today' ? 'No upcoming trips' : 'No past trips'}
          description={hasNextPage ? segment === 'today' ? 'Load more trips to check for assigned trips.' : 'Load more trips to view earlier trip history.' : role === 'guardian' ? 'No trips for your linked riders in this view. Pull down to refresh.' : 'Trips assigned by your transport provider will appear here.'} />}
				onEndReached={() => (hasNextPage && !isFetchingNextPage && !isError ? fetchNextPage() : undefined)}
				onEndReachedThreshold={0.3}
        ListFooterComponent={isError ? <AppButton label="Retry trips" onPress={() => void refetch()} /> : hasNextPage ? <AppButton label="Load more trips" variant="outlined" loading={isFetchingNextPage} onPress={() => void fetchNextPage()} /> : null}
				refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
				contentContainerStyle={[
					filtered.length === 0 ? styles.emptyContent : styles.listContent,
					{
						paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
						paddingBottom: Spacing.xxxl,
					},
				]}
			/>
		</View>
	);
}

function RideCard({ item, onPress, onTrack }: { item: RiderPortalRideRecord; onPress: () => void; onTrack: () => void }) {
  const styles = useThemedStyles(createStyles);
	return (
		<AppCard style={styles.card}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View trip ${item.rideNumber}`} onPress={onPress} activeOpacity={0.85} style={{ gap: Spacing.xs }}>
				<View style={styles.row}>
					<Text style={styles.rideNumber}>{item.rideNumber}</Text>
					<AppBadge status={item.status} />
				</View>
				<Text style={styles.meta}>{formatShortDateTime(item.scheduledPickupAt)}</Text>
				<Text style={styles.address}>{item.pickupAddress ?? 'Pickup TBD'}</Text>
				<Text style={styles.address}>{item.dropoffAddress ?? 'Drop-off TBD'}</Text>
				{item.riderName ? <Text style={styles.rider}>Rider: {item.riderName}</Text> : null}
			</TouchableOpacity>
      {isTrackableTrip(item.status) ? <AppButton label="Track" accessibilityLabel={`Track trip ${item.rideNumber}`} leftIcon="map-marker-radius-outline" onPress={onTrack} /> : null}
    </AppCard>
	);
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	headerCard: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
	segmentRow: { flexDirection: 'row', gap: Spacing.sm },
	segmentButton: {
		flex: 1,
        minHeight: 48, justifyContent: 'center',
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: Spacing.sm,
		backgroundColor: colors.surface,
	},
	segmentSelected: {
		backgroundColor: colors.accent,
		borderColor: colors.accent,
	},
	segmentLabel: {
		textAlign: 'center',
		fontFamily: 'Inter_600SemiBold',
		fontSize: Typography.sizeSm,
		color: colors.textSecondary,
	},
	segmentLabelSelected: { color: colors.onAccent },
	listContent: { paddingTop: Spacing.sm },
	card: { gap: Spacing.xs },
	row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
	rideNumber: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeMd, color: colors.textPrimary },
	meta: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeXs, color: colors.textSecondary },
	address: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textPrimary },
	rider: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: colors.primary },
	sep: { height: Spacing.sm },
	emptyContent: { flex: 1 },
});
