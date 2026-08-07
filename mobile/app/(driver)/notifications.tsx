import React from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@api/notificationsApi';
import { AppBadge, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.search({ size: 50 }),
  });

  const { mutate: markAll } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionHeader title="Notifications" />
        {items.some((n) => n.readStatus === 'UNREAD') && (
          <AppButton label="Mark all read" onPress={() => markAll()} variant="ghost" size="sm" />
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id)}
        renderItem={({ item }) => (
          <View style={[styles.item, item.readStatus === 'UNREAD' && styles.unread]}>
            <View style={styles.row}>
              <AppBadge status={item.notificationType} label={item.notificationType} />
              <Text style={styles.time}>{formatShortDateTime(item.sentAt)}</Text>
            </View>
            <Text style={styles.summary}>{item.summary}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<EmptyState title="No notifications" />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={items.length === 0 && styles.emptyContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  item: { padding: Spacing.lg, gap: Spacing.xs },
  unread: { backgroundColor: '#f0f7fa' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeXs, color: Colors.textSecondary },
  summary: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  sep: { height: 1, backgroundColor: Colors.divider },
  emptyContent: { flex: 1 },
});
