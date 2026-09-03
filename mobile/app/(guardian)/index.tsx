import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppCard } from '@components/ui';
import { MetricTile } from '@components/MetricTile';
import { SectionHeader } from '@components/SectionHeader';
import { LoadingState } from '@components/LoadingState';
import { ActionRow } from '@components/ActionRow';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';

export default function GuardianHomePage() {
	const router = useRouter();
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ['guardian-dashboard'],
		queryFn: () => riderPortalApi.getDashboard(),
	});
	const { data: riders } = useQuery({
		queryKey: ['guardian-linked-riders-home'],
		queryFn: () => riderPortalApi.getLinkedRiders(),
	});

	if (isLoading) return <LoadingState />;

	const linked = riders ?? [];
	const primary = linked[0];

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
		>
			<View style={styles.hero}>
				<Text style={styles.heroLabel}>Guardian Home</Text>
				<Text style={styles.heroTitle}>{primary?.riderDisplayName ?? 'Family Dashboard'}</Text>
				<Text style={styles.heroSubtitle}>Live view of rider activity and safety alerts.</Text>
			</View>

			<SectionHeader title="Status Snapshot" />
			<View style={styles.metricGrid}>
				<MetricTile label="Linked Riders" value={data?.linkedRiderCount ?? linked.length} accent />
				<MetricTile label="Upcoming" value={data?.upcomingRideCount ?? 0} />
				<MetricTile label="Active" value={data?.activeRideCount ?? 0} />
				<MetricTile label="Unread" value={data?.unreadNotifications ?? 0} />
			</View>

			<SectionHeader title="Primary Rider" />
			<AppCard style={styles.riderCard}>
				<Text style={styles.riderName}>{primary?.riderDisplayName ?? 'No rider linked yet'}</Text>
				<Text style={styles.riderMeta}>Code: {primary?.riderCode ?? '—'}</Text>
				<Text style={styles.riderMeta}>Status: {primary?.status ?? '—'}</Text>
			</AppCard>

			<SectionHeader title="Quick Actions" />
			<View style={styles.quickActions}>
				<ActionRow
					icon="map-marker-path"
					title="Live Tracking"
					description="Monitor current rider movement"
					onPress={() => router.push('/(guardian)/riders')}
				/>
				<ActionRow
					icon="history"
					title="Ride Activity"
					description="Review today and past rides"
					onPress={() => router.push('/(guardian)/rides')}
					tone="secondary"
				/>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg },
	hero: {
		backgroundColor: GuardianRoleTheme.primary,
		borderRadius: 18,
		padding: Spacing.lg,
		gap: Spacing.xs,
	},
	heroLabel: {
		fontFamily: 'SourceSans3_700Bold',
		fontSize: Typography.sizeSm,
		color: Colors.white,
	},
	heroTitle: {
		fontFamily: 'SpaceGrotesk_700Bold',
		fontSize: Typography.sizeXl,
		color: Colors.white,
	},
	heroSubtitle: {
		fontFamily: 'SourceSans3_400Regular',
		fontSize: Typography.sizeSm,
		color: Colors.white,
		opacity: 0.92,
	},
	metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
	riderCard: { gap: Spacing.xs },
	riderName: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
	riderMeta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
	quickActions: { gap: Spacing.sm },
});
