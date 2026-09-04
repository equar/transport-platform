import React from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import type { RiderPortalRideRecord } from '@api/riderPortalApi';
import { AppBadge, AppCard } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';

type RideSegment = 'today' | 'history';

export default function GuardianRidesPage() {
	const router = useRouter();
	const { width } = useWindowDimensions();
	const isCompact = width < 380;
	const [segment, setSegment] = React.useState<RideSegment>('today');
	const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } = useInfiniteQuery({
		queryKey: ['guardian-rides'],
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			riderPortalApi.searchRides({
				page: pageParam,
				size: 20,
				sort: 'scheduledPickupAt,desc',
			}),
		getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
	});

	if (isLoading) return <LoadingState />;

	const rides = data?.pages.flatMap((p) => p.items) ?? [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayTs = today.getTime();
	const filtered = rides.filter((ride) => {
		const rideTs = new Date(ride.scheduledPickupAt).getTime();
		return segment === 'today' ? rideTs >= todayTs : rideTs < todayTs;
	});

	return (
		<View style={styles.container}>
			<View style={styles.headerCard}>
				<SectionHeader title="Ride Activity" subtitle="Monitor rider trip timeline" />
				<View style={styles.segmentRow}>
					<TouchableOpacity
						style={[styles.segmentButton, segment === 'today' ? styles.segmentSelected : undefined]}
						onPress={() => setSegment('today')}
						activeOpacity={0.85}
					>
						<Text style={[styles.segmentLabel, segment === 'today' ? styles.segmentLabelSelected : undefined]}>Today</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.segmentButton, segment === 'history' ? styles.segmentSelected : undefined]}
						onPress={() => setSegment('history')}
						activeOpacity={0.85}
					>
						<Text style={[styles.segmentLabel, segment === 'history' ? styles.segmentLabelSelected : undefined]}>History</Text>
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				data={filtered}
				keyExtractor={(r) => String(r.id)}
				renderItem={({ item }) => <RideCard item={item} onPress={() => router.push(`/(guardian)/rides/${item.id}`)} />}
				ItemSeparatorComponent={() => <View style={styles.sep} />}
				ListEmptyComponent={<EmptyState title="No ride records" description="No rides for this segment." />}
				onEndReached={() => (hasNextPage ? fetchNextPage() : undefined)}
				onEndReachedThreshold={0.3}
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

function RideCard({ item, onPress }: { item: RiderPortalRideRecord; onPress: () => void }) {
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={0.85}>
			<AppCard style={styles.card}>
				<View style={styles.row}>
					<Text style={styles.rideNumber}>{item.rideNumber}</Text>
					<AppBadge status={item.status} />
				</View>
				<Text style={styles.meta}>{formatShortDateTime(item.scheduledPickupAt)}</Text>
				<Text style={styles.address}>{item.pickupAddress ?? 'Pickup TBD'}</Text>
				<Text style={styles.address}>{item.dropoffAddress ?? 'Drop-off TBD'}</Text>
				{item.riderName ? <Text style={styles.rider}>Rider: {item.riderName}</Text> : null}
			</AppCard>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	headerCard: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
	segmentRow: { flexDirection: 'row', gap: Spacing.sm },
	segmentButton: {
		flex: 1,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 10,
		paddingVertical: Spacing.sm,
		backgroundColor: Colors.surface,
	},
	segmentSelected: {
		backgroundColor: GuardianRoleTheme.primary,
		borderColor: GuardianRoleTheme.primary,
	},
	segmentLabel: {
		textAlign: 'center',
		fontFamily: 'SourceSans3_600SemiBold',
		fontSize: Typography.sizeSm,
		color: Colors.textSecondary,
	},
	segmentLabelSelected: { color: Colors.white },
	listContent: { paddingTop: Spacing.sm },
	card: { gap: Spacing.xs },
	row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	rideNumber: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
	meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeXs, color: Colors.textSecondary },
	address: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	rider: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: GuardianRoleTheme.primary },
	sep: { height: Spacing.sm },
	emptyContent: { flex: 1 },
});
