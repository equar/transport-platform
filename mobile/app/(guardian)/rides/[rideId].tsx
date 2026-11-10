import { SupportContact } from '@components/SupportContact';
import { RequestError } from '@components/RequestError';
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

	const { data: ride, isLoading, isError, refetch, isRefetching } = useQuery({
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

	if (isLoading) return <LoadingState />;
  if (isError || !ride) return <RequestError onRetry={() => void refetch()} />;

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
		>
			<View style={styles.heroCard}>
				<Text style={styles.heroTitle}>Trip details</Text>
				<Text style={styles.heroRide}>{ride.rideNumber}</Text>
				<View style={styles.heroMetaRow}>
					<Text style={styles.heroTime}>{formatShortDateTime(ride.scheduledPickupAt)}</Text>
					<AppBadge status={ride.status} />
				</View>
			</View>

			<Text accessibilityRole="button" style={[styles.back, { minHeight: 48, paddingVertical: 12 }]} onPress={() => router.back()}>
				← Ride Activity
			</Text>

			<AppCard style={styles.personCard}>
				<Text style={styles.personTitle}>Rider & guardian</Text>
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
            <Text style={styles.personText}>To change or cancel a booking, contact your transport provider.</Text>
            <SupportContact />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg },
	heroCard: {
		backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
		borderRadius: 14,
		padding: Spacing.lg,
		gap: Spacing.xs,
	},
	heroTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	heroRide: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeXl, color: Colors.textPrimary },
	heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
	heroTime: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	back: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: GuardianRoleTheme.primary },
	personCard: { gap: Spacing.xs },
	personTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary, textTransform: 'uppercase' },
	personText: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	routeCard: { gap: Spacing.xs },
	sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary, textTransform: 'uppercase' },
	routeText: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
	actionRow: { flexDirection: 'row', gap: Spacing.sm },
	actionSlot: { flex: 1 },
});
