import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@api/notificationsApi';
import { AppBadge, AppButton, AppCard } from '@components/ui';
import { SectionHeader } from '@components/SectionHeader';
import { EmptyState } from '@components/EmptyState';
import { LoadingState } from '@components/LoadingState';
import { RequestError } from '@components/RequestError';
import { Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';
export default function NotificationsScreen() {
  const styles = useThemedStyles(createStyles);
  const client = useQueryClient();
  const query = useInfiniteQuery({ queryKey: ['notifications'], initialPageParam: 0,
    queryFn: ({ pageParam }) => notificationsApi.search({ page: pageParam, size: 20 }),
    getNextPageParam: last => last.page+1 < last.totalPages ? last.page+1 : undefined });
  const mark = useMutation({ mutationFn: (id: number | null) => id == null ? notificationsApi.markAllRead() : notificationsApi.markRead(id),
    onSuccess: () => client.invalidateQueries(),
    onError: () => Alert.alert('Couldn’t update alerts', 'Check your connection and try again.') });
  if (query.isLoading) return <LoadingState />;
  if (query.isError && !query.data) return <RequestError onRetry={() => void query.refetch()} />;
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  return <View style={styles.screen}>
    <View style={styles.header}><SectionHeader title="Alerts" subtitle="Trip updates from your transport provider." />
      {items.some(item => item.readStatus === 'UNREAD') && <AppButton label="Mark all read" variant="ghost" loading={mark.isPending} onPress={() => mark.mutate(null)} />}
    </View>
    <FlatList data={items} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} />}
      contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      renderItem={({ item }) => <AppCard style={item.readStatus === 'UNREAD' ? styles.unread : styles.item}>
        <View style={styles.metaRow}><AppBadge status={item.notificationType} /><Text style={styles.date}>{formatShortDateTime(item.sentAt)}</Text></View>
        {!!item.subject && <Text style={styles.subject}>{item.subject}</Text>}
        <Text style={styles.body}>{item.summary}</Text>
        {item.readStatus === 'UNREAD' && <AppButton label="Mark as read" variant="ghost" size="sm" disabled={mark.isPending} onPress={() => mark.mutate(item.id)} />}
      </AppCard>}
      ListEmptyComponent={<EmptyState title="You’re all caught up" description="Your provider’s updates and trip alerts will appear here." />}
      onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage(); }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={query.hasNextPage ? <AppButton label="Load more alerts" variant="outlined" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} /> : null}
    />
  </View>;
}
const createStyles = (colors: BrandColors) => StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, header: { padding: Spacing.xl, gap: Spacing.md }, list: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl }, item: { gap: Spacing.md }, unread: { gap: Spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary }, metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center', justifyContent: 'space-between' }, date: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXs, color: colors.textSecondary }, subject: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizeMd, color: colors.textPrimary }, body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: colors.textPrimary, lineHeight: 23 } });
