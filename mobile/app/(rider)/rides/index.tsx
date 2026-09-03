import React from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { PassengerRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';

type RideSegment = 'upcoming' | 'post';

export default function RiderRidesPage() {
  const router = useRouter();
  const [segment, setSegment] = React.useState<RideSegment>('upcoming');
  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } = useInfiniteQuery({
    queryKey: ['rider-rides'],
    queryFn: ({ pageParam = 0 }) =>
      riderPortalApi.searchRides({ page: pageParam, size: 20, sort: 'scheduledPickupAt,asc' }),
    getNextPageParam: (last, pages) =>
      last.page + 1 < last.totalPages ? pages.length : undefined,
    initialPageParam: 0,
  });

  const rides = data?.pages.flatMap((p) => p.items) ?? [];
  const now = Date.now();
  const filtered = rides.filter((ride) => {
    const ts = new Date(ride.scheduledPickupAt).getTime();
    if (segment === 'upcoming') {
      return ts >= now || !['COMPLETED', 'CANCELLED', 'MISSED', 'FAILED'].includes(ride.status);
    }
    return ts < now || ['COMPLETED', 'CANCELLED', 'MISSED', 'FAILED'].includes(ride.status);
  });

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <SectionHeader title="My Rides" subtitle="Track upcoming and past trips" />
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentButton, segment === 'upcoming' && styles.segmentSelected]}
            onPress={() => setSegment('upcoming')}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentLabel, segment === 'upcoming' && styles.segmentLabelSelected]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, segment === 'post' && styles.segmentSelected]}
            onPress={() => setSegment('post')}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentLabel, segment === 'post' && styles.segmentLabelSelected]}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(rider)/rides/${item.id}`)}
            activeOpacity={0.85}
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
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<EmptyState title="No rides" description="No rides for this segment." />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={filtered.length === 0 && styles.emptyContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  segmentSelected: {
    backgroundColor: PassengerRoleTheme.primary,
    borderColor: PassengerRoleTheme.primary,
  },
  segmentLabel: {
    textAlign: 'center',
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  segmentLabelSelected: {
    color: Colors.white,
  },
  card: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rideNumber: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  riderName: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  address: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  sep: { height: Spacing.sm },
  emptyContent: { flex: 1 },
});
