import React from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@api/notificationsApi';
import { AppBadge, AppButton, AppCard } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';

export default function GuardianNotificationsPage() {
	const qc = useQueryClient();
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ['guardian-notifications'],
		queryFn: () => notificationsApi.search({ size: 50 }),
	});

	const { mutate: markAll } = useMutation({
		mutationFn: () => notificationsApi.markAllRead(),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['guardian-notifications'] }),
	});

	const items = data?.items ?? [];

	if (isLoading) return <LoadingState />;

	return (
		<View style={styles.container}>
			<View style={styles.hero}>
				<SectionHeader title="Notifications" subtitle="Family and trip alerts" />
				{items.some((n) => n.readStatus === 'UNREAD') ? (
					<AppButton label="Mark all read" onPress={() => markAll()} variant="ghost" size="sm" />
				) : null}
			</View>

			<FlatList
				data={items}
				keyExtractor={(n) => String(n.id)}
				renderItem={({ item }) => (
					<AppCard style={item.readStatus === 'UNREAD' ? { ...styles.item, ...styles.unread } : styles.item}>
						<View style={styles.row}>
							<AppBadge status={item.notificationType} label={item.notificationType} />
							<Text style={styles.time}>{formatShortDateTime(item.sentAt)}</Text>
						</View>
						<Text style={styles.summary}>{item.summary}</Text>
					</AppCard>
				)}
				ItemSeparatorComponent={() => <View style={styles.sep} />}
				ListEmptyComponent={<EmptyState title="No alerts" />}
				refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
				contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	hero: {
		padding: Spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
		backgroundColor: GuardianRoleTheme.soft,
	},
	listContent: { padding: Spacing.lg },
	item: { gap: Spacing.xs },
	unread: { borderColor: GuardianRoleTheme.primary },
	row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	time: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeXs, color: Colors.textSecondary },
	summary: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeMd, color: Colors.textPrimary },
	sep: { height: Spacing.sm },
	emptyContent: { flex: 1 },
});
