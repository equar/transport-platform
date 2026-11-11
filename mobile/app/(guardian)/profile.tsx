import { AccountActions } from '@components/AccountActions';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import React from 'react';
import { StyleSheet, ScrollView, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { EmptyState } from '@components/EmptyState';
import { AppCard } from '@components/ui';
import { Spacing, Typography } from '@theme/tokens';

export default function GuardianProfilePage() {
  const styles = useThemedStyles(createStyles);
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
				<Text style={styles.heroTitle}>Guardian Profile</Text>
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
		<AccountActions />
    </ScrollView>
	);
}

function Row({ label, value }: { label: string; value: string }) {
  const rowStyles = useThemedStyles(createRowStyles);
	return (
		<Text style={rowStyles.line}>
			<Text style={rowStyles.label}>{label}: </Text>
			<Text style={rowStyles.value}>{value}</Text>
		</Text>
	);
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: { padding: Spacing.lg, gap: Spacing.lg },
	heroCard: {
		backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
		borderRadius: 16,
		gap: Spacing.xs,
	},
	heroTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.textPrimary },
	heroName: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeXl, color: colors.textPrimary },
	heroMeta: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textPrimary, opacity: 0.9 },
	section: { gap: Spacing.xs },
	sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.textSecondary, textTransform: 'uppercase' },
});

const createRowStyles = (colors: BrandColors) => StyleSheet.create({
	line: { paddingVertical: 2 },
	label: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeSm, color: colors.textSecondary },
	value: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textPrimary },
});
