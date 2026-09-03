import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { TripTrackingCard } from '@components/TripTrackingCard';
import { AppBadge, AppButton, AppCard } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';

export default function GuardianRideDetailPage() {
	const router = useRouter();
	const { rideId } = useLocalSearchParams<{ rideId: string }>();

	const { data: ride, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ['guardian-ride-detail', rideId],
		queryFn: () => riderPortalApi.getRide(Number(rideId)),
		enabled: Boolean(rideId),
	});

	const {
		data: locationSnapshot,
		refetch: refetchLocationSnapshot,
		isRefetching: locationRefreshing,
	} = useQuery({
		queryKey: ['guardian-ride-location', rideId],
		queryFn: () => riderPortalApi.getRideLocationSnapshot(Number(rideId)),
		enabled: Boolean(rideId),
		refetchInterval: 30000,
	});

	if (isLoading || !ride) return <LoadingState />;

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
		>
			<View style={styles.heroCard}>
				<Text style={styles.heroTitle}>Live Tracking</Text>
				<Text style={styles.heroRide}>{ride.rideNumber}</Text>
				<View style={styles.heroMetaRow}>
					<Text style={styles.heroTime}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
					<AppBadge status={ride.status} />
				</View>
			</View>

			<Text style={styles.back} onPress={() => router.back()}>
				← Ride Activity
			</Text>

			<AppCard style={styles.personCard}>
				<Text style={styles.personTitle}>Rider & Driver</Text>
				<Text style={styles.personText}>Rider: {ride.riderName ?? '—'}</Text>
				<Text style={styles.personText}>Guardian Contact: {ride.guardianName ?? 'Not provided'}</Text>
			</AppCard>

			<AppCard style={styles.routeCard}>
				<Text style={styles.sectionTitle}>Route</Text>
				<Text style={styles.routeText}>{ride.pickupAddress ?? 'Pickup TBD'}</Text>
				<Text style={styles.routeText}>{ride.dropoffAddress ?? 'Drop-off TBD'}</Text>
			</AppCard>

			<TripTrackingCard
				title="Current Position"
				snapshot={locationSnapshot ?? null}
				pickupAddress={ride.pickupAddress}
				dropoffAddress={ride.dropoffAddress}
				onRefresh={() => {
					void refetchLocationSnapshot();
				}}
				refreshing={locationRefreshing}
			/>

			<View style={styles.actionRow}>
				<View style={styles.actionSlot}>
					<AppButton label="Refresh" variant="outlined" onPress={() => refetch()} fullWidth />
				</View>
				<View style={styles.actionSlot}>
					<AppButton label="Riders" onPress={() => router.push('/(guardian)/riders')} fullWidth />
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg },
	heroCard: {
		backgroundColor: GuardianRoleTheme.primary,
		borderRadius: 18,
		padding: Spacing.lg,
		gap: Spacing.xs,
	},
	heroTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.white },
	heroRide: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.white },
	heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	heroTime: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.white },
	back: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: GuardianRoleTheme.primary },
	personCard: { gap: Spacing.xs },
	personTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary, textTransform: 'uppercase' },
	personText: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	routeCard: { gap: Spacing.xs },
	sectionTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary, textTransform: 'uppercase' },
	routeText: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	actionRow: { flexDirection: 'row', gap: Spacing.sm },
	actionSlot: { flex: 1 },
});
