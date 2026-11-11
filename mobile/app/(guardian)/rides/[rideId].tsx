import { isFinishedTrip, isTrackableTrip } from '@utils/tripPresentation';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
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
import { Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

export default function GuardianRideDetailPage() {
  const styles = useThemedStyles(createStyles);
	const router = useRouter();
	const { rideId } = useLocalSearchParams<{ rideId: string }>();

	const { data: ride, isLoading, isError, refetch, isRefetching } = useQuery({
		queryKey: ['guardian-ride-detail', rideId],
    refetchInterval: query => query.state.data && !isFinishedTrip(query.state.data.status) ? 15000 : false,
		queryFn: () => riderPortalApi.getRide(Number(rideId)),
		enabled: Boolean(rideId),
	});

	const {
		data: locationSnapshot,
		refetch: refetchLocationSnapshot,
		isRefetching: locationRefreshing,
    isError: locationError,
	} = useQuery({
		queryKey: ['guardian-ride-location', rideId],
		queryFn: () => riderPortalApi.getRideLocationSnapshot(Number(rideId)),
		enabled: !!ride && !isError && isTrackableTrip(ride.status),
		refetchInterval: ride && isTrackableTrip(ride.status) ? 30000 : false,
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
				← Riders’ Trips
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
				snapshot={isTrackableTrip(ride.status) ? locationSnapshot ?? null : null}
        error={locationError && isTrackableTrip(ride.status)}
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
            <Text style={styles.personText}>To change or cancel an assigned trip, contact your transport provider.</Text>
            <SupportContact />
		</ScrollView>
	);
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg },
	heroCard: {
		backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
		borderRadius: 14,
		padding: Spacing.lg,
		gap: Spacing.xs,
	},
	heroTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.textPrimary },
	heroRide: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeXl, color: colors.textPrimary },
	heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
	heroTime: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: colors.textPrimary },
	back: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.primary },
	personCard: { gap: Spacing.xs },
	personTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.textSecondary, textTransform: 'uppercase' },
	personText: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textPrimary },
	routeCard: { gap: Spacing.xs },
	sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.textSecondary, textTransform: 'uppercase' },
	routeText: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textPrimary },
	actionRow: { flexDirection: 'row', gap: Spacing.sm },
	actionSlot: { flex: 1 },
});
