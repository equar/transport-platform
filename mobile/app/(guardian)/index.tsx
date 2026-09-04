import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, Pressable, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppCard } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { ActionRow } from '@components/ActionRow';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';
import { useAuth } from '@auth/AuthContext';

export default function GuardianHomePage() {
	const router = useRouter();
	const { signOut } = useAuth();
	const { width } = useWindowDimensions();
	const isCompact = width < 380;
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
	const dateLabel = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date());

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[
				styles.content,
				{
					paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
					gap: isCompact ? Spacing.md : Spacing.lg,
				},
			]}
			refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
		>
			<View style={[styles.heroRow, isCompact && styles.heroRowCompact]}>
				<View style={styles.identityRow}>
					<View style={styles.avatarShell}>
						<Text style={styles.avatarText}>G</Text>
					</View>
					<View style={styles.identityCopy}>
						<Text style={styles.greeting}>Family overview</Text>
						<Text style={styles.identityName}>{primary?.riderDisplayName ?? 'Guardian Dashboard'}</Text>
					</View>
				</View>
				<View style={styles.heroActions}>
					<Pressable style={styles.roundIconButton} onPress={() => router.push('/(guardian)/notifications')}>
						<MaterialCommunityIcons name="bell-outline" size={20} color={Colors.textPrimary} />
					</Pressable>
					<Pressable style={styles.roundIconButton} onPress={() => void signOut()}>
						<MaterialCommunityIcons name="logout" size={20} color={Colors.textPrimary} />
					</Pressable>
				</View>
			</View>

			<AppCard style={styles.summaryCard}>
				<View style={styles.summaryHeader}>
					<Text style={styles.summaryTitle}>Status Snapshot</Text>
					<Text style={styles.summaryDate}>{dateLabel}</Text>
				</View>
				<View style={styles.summaryStatsGrid}>
					<View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
						<Text style={styles.summaryValue}>{data?.linkedRiderCount ?? linked.length}</Text>
						<Text style={styles.summaryLabel}>Linked Riders</Text>
					</View>
					<View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
						<Text style={styles.summaryValue}>{data?.upcomingRideCount ?? 0}</Text>
						<Text style={styles.summaryLabel}>Upcoming</Text>
					</View>
					<View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
						<Text style={styles.summaryValue}>{data?.activeRideCount ?? 0}</Text>
						<Text style={styles.summaryLabel}>In Transit</Text>
					</View>
					<View style={[styles.summaryStatCard, isCompact && styles.summaryStatCardFull]}>
						<Text style={styles.summaryValue}>{data?.unreadNotifications ?? 0}</Text>
						<Text style={styles.summaryLabel}>Alerts</Text>
					</View>
				</View>
			</AppCard>

			<AppCard style={styles.riderCard}>
				<View style={styles.riderHeader}>
					<Text style={styles.riderTitle}>Primary Rider</Text>
					<Text style={styles.riderStatus}>{(primary?.status ?? 'unknown').toLowerCase()}</Text>
				</View>
				<Text style={styles.riderName}>{primary?.riderDisplayName ?? 'No rider linked yet'}</Text>
				<Text style={styles.riderMeta}>Code: {primary?.riderCode ?? '—'}</Text>
				<Text style={styles.riderMeta}>Relationship: {primary?.relationshipType ?? 'Not set'}</Text>
				<Pressable style={styles.riderActionButton} onPress={() => router.push('/(guardian)/riders')}>
					<Text style={styles.riderActionText}>Open Live Tracking</Text>
				</Pressable>
			</AppCard>

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
				<ActionRow
					icon="account-cog-outline"
					title="Manage Profile"
					description="Update contacts and guardianship settings"
					onPress={() => router.push('/(guardian)/profile')}
				/>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl },
	heroRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: Spacing.md,
		backgroundColor: Colors.surfaceStrong,
		marginHorizontal: -Spacing.lg,
		marginTop: -Spacing.lg,
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.xxl,
	},
	heroRowCompact: {
		alignItems: 'flex-start',
		flexWrap: 'wrap',
	},
	identityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.md,
		flex: 1,
	},
	avatarShell: {
		width: 50,
		height: 50,
		borderRadius: Radius.full,
		backgroundColor: Colors.white,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarText: {
		fontFamily: 'SpaceGrotesk_700Bold',
		fontSize: Typography.sizeXl,
		color: GuardianRoleTheme.primaryStrong,
	},
	identityCopy: { gap: 2 },
	greeting: {
		fontFamily: 'SourceSans3_400Regular',
		fontSize: Typography.sizeMd,
		color: Colors.onPrimaryMuted,
	},
	identityName: {
		fontFamily: 'SpaceGrotesk_700Bold',
		fontSize: Typography.sizeXxl,
		color: Colors.white,
	},
	heroActions: {
		flexDirection: 'row',
		gap: Spacing.sm,
	},
	roundIconButton: {
		width: 38,
		height: 38,
		borderRadius: Radius.full,
		borderWidth: 1,
		borderColor: Colors.onPrimaryBorder,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.onPrimaryOverlay,
	},
	summaryCard: { gap: Spacing.md },
	summaryHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	summaryTitle: {
		fontFamily: 'SourceSans3_700Bold',
		fontSize: Typography.sizeLg,
		color: Colors.textSecondary,
		textTransform: 'uppercase',
	},
	summaryDate: {
		fontFamily: 'SourceSans3_600SemiBold',
		fontSize: Typography.sizeSm,
		color: GuardianRoleTheme.primary,
	},
	summaryStatsGrid: {
		flexDirection: 'row',
		gap: 0,
	},
	summaryStatCard: {
		flex: 1,
		paddingHorizontal: Spacing.sm,
		alignItems: 'center',
		gap: 2,
	},
	summaryStatCardFull: {
		flexBasis: '100%',
	},
	summaryValue: {
		fontFamily: 'SpaceGrotesk_700Bold',
		fontSize: Typography.sizeXl,
		color: Colors.textPrimary,
		textAlign: 'center',
	},
	summaryLabel: {
		fontFamily: 'SourceSans3_400Regular',
		fontSize: Typography.sizeSm,
		color: Colors.textSecondary,
		textAlign: 'center',
	},
	riderCard: { gap: Spacing.xs },
	riderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: Spacing.xs,
	},
	riderTitle: {
		fontFamily: 'SourceSans3_700Bold',
		fontSize: Typography.sizeLg,
		color: Colors.textSecondary,
		textTransform: 'uppercase',
	},
	riderStatus: {
		fontFamily: 'SourceSans3_600SemiBold',
		fontSize: Typography.sizeSm,
		color: GuardianRoleTheme.primary,
		textTransform: 'capitalize',
	},
	riderName: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.textPrimary },
	riderMeta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeMd, color: Colors.textSecondary },
	riderActionButton: {
		marginTop: Spacing.sm,
		backgroundColor: GuardianRoleTheme.primary,
		borderRadius: Radius.md,
		paddingVertical: Spacing.sm,
		alignItems: 'center',
	},
	riderActionText: {
		fontFamily: 'SourceSans3_700Bold',
		fontSize: Typography.sizeMd,
		color: Colors.white,
	},
	quickActions: { gap: Spacing.sm },
});
