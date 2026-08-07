import React from 'react';
import { StyleSheet, FlatList, View, Text, Pressable, RefreshControl } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Radius, Shadow, Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

export default function RiderRidesPage() {
  const router = useRouter();
  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } = useInfiniteQuery({
    queryKey: ['rider-rides'],
    queryFn: ({ pageParam = 0 }) =>
      riderPortalApi.searchRides({ page: pageParam, size: 20, sort: 'scheduledPickupAt,asc' }),
    getNextPageParam: (last, pages) =>
      last.page + 1 < last.totalPages ? pages.length : undefined,
    initialPageParam: 0,
  });

  const rides = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionHeader title="My Rides" subtitle="Upcoming and active rides" />
      </View>
      <FlatList
        data={rides}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/(rider)/rides/${item.id}`)}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            accessibilityRole="button"
            accessibilityLabel={`Ride ${item.rideNumber} for ${item.riderName}`}
          >
            <View style={styles.row}>
              <Text style={styles.rideNumber}>{item.rideNumber}</Text>
              <AppBadge status={item.status} />
            </View>
            <Text style={styles.riderName}>{item.riderName}</Text>
            <Text style={styles.meta}>
              {formatShortDateTime(item.scheduledPickupAt)}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {item.pickupAddress ?? '—'} → {item.dropoffAddress ?? '—'}
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<EmptyState title="No rides" description="No upcoming rides scheduled." />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={rides.length === 0 ? styles.emptyContent : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingTop: Spacing.xxl, backgroundColor: Colors.surface },
  listContent: { padding: Spacing.lg },
  card: { padding: Spacing.lg, gap: Spacing.xs, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, ...Shadow.card },
  cardPressed: { backgroundColor: Colors.surfaceMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rideNumber: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  riderName: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  address: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary, marginTop: Spacing.sm, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: Spacing.md },
  sep: { height: Spacing.md },
  emptyContent: { flex: 1 },
});
