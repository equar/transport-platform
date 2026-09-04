import React from 'react';
import { StyleSheet, ScrollView, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { EmptyState } from '@components/EmptyState';
import { AppCard } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';

export default function GuardianProfilePage() {
	const { width } = useWindowDimensions();
	const isCompact = width < 380;
	const {
		data: profile,
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	} = useQuery({
		queryKey: ['guardian-profile'],
		queryFn: () => riderPortalApi.getProfile(),
	});

	if (isLoading) return <LoadingState />;

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
			<AppCard style={styles.heroCard} noBorder>
				<Text style={styles.heroTitle}>Account</Text>
				<Text style={styles.heroName}>{profile ? `${profile.firstName} ${profile.lastName}` : 'Guardian Account'}</Text>
				<Text style={styles.heroMeta}>{profile?.email ?? profile?.phone ?? 'No email or phone on file'}</Text>
			</AppCard>

			{isError ? (
				<AppCard>
					<EmptyState
						title="Unable to load profile"
						description={error instanceof Error ? error.message : 'Pull to refresh and try again.'}
					/>
				</AppCard>
			) : !profile ? (
				<AppCard>
					<EmptyState
						title="Profile unavailable"
						description="No guardian profile data was returned yet. Pull down to refresh."
					/>
				</AppCard>
			) : (
				<>
					<SectionHeader title="Guardian Details" subtitle={profile.code ?? profile.scopeType} />

					<AppCard style={styles.section}>
						<Text style={styles.sectionTitle}>Contact</Text>
						<Row label="Phone" value={profile.phone} />
						<Row label="Email" value={profile.email ?? '—'} />
						<Row label="Status" value={profile.status} />
					</AppCard>

					<AppCard style={styles.section}>
						<Text style={styles.sectionTitle}>Defaults</Text>
						<Row label="Pickup" value={profile.defaultPickupAddress ?? '—'} />
						<Row label="Drop-off" value={profile.defaultDropoffAddress ?? '—'} />
					</AppCard>

					<AppCard style={styles.section}>
						<Text style={styles.sectionTitle}>Emergency</Text>
						<Row label="Name" value={profile.emergencyContactName ?? '—'} />
						<Row label="Phone" value={profile.emergencyContactPhone ?? '—'} />
					</AppCard>
				</>
			)}
		</ScrollView>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<Text style={rowStyles.line}>
			<Text style={rowStyles.label}>{label}: </Text>
			<Text style={rowStyles.value}>{value}</Text>
		</Text>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg },
	heroCard: {
		backgroundColor: GuardianRoleTheme.primary,
		borderRadius: 18,
		gap: Spacing.xs,
	},
	heroTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.white },
	heroName: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.white },
	heroMeta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.white, opacity: 0.9 },
	section: { gap: Spacing.xs },
	sectionTitle: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.textSecondary, textTransform: 'uppercase' },
});

const rowStyles = StyleSheet.create({
	line: { paddingVertical: 2 },
	label: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary },
	value: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textPrimary },
});
