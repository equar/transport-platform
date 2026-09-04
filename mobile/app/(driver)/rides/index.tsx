import React from 'react';
import { StyleSheet, FlatList, View, RefreshControl, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi, type DriverPortalRideSummaryRecord } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { AppBadge } from '@components/ui';
import { Colors, Shadow, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';
import { formatShortDateTime } from '@utils/formatDate';

const PAGE_SIZE = 20;
type DispatchSegment = 'assigned' | 'completed' | 'cancelled';

const STATUS_SEGMENTS: Record<DispatchSegment, string[]> = {
  assigned: ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP'],
  completed: ['DROPPED_OFF', 'COMPLETED'],
  cancelled: ['CANCELLED', 'MISSED', 'FAILED', 'RIDER_NO_SHOW'],
};

export default function DriverRidesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [segment, setSegment] = React.useState<DispatchSegment>('assigned');

  const { data, isLoading, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['driver-rides'],
      queryFn: ({ pageParam = 0 }) =>
        driverPortalApi.searchRides({ page: pageParam, size: PAGE_SIZE, sort: 'scheduledPickupAt,asc' }),
      getNextPageParam: (last, pages) =>
        last.page + 1 < last.totalPages ? pages.length : undefined,
      initialPageParam: 0,
    });

  const rides = data?.pages.flatMap((p) => p.items) ?? [];
  const filteredRides = rides.filter((ride) => STATUS_SEGMENTS[segment].includes(ride.status));

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <SectionHeader title="Dispatches" subtitle="Track assignments across current trip states" />
          <View style={styles.segmentRow}>
            <SegmentButton
              label="Assigned"
              selected={segment === 'assigned'}
              onPress={() => setSegment('assigned')}
            />
            <SegmentButton
              label="Completed"
              selected={segment === 'completed'}
              onPress={() => setSegment('completed')}
            />
            <SegmentButton
              label="Cancelled"
              selected={segment === 'cancelled'}
              onPress={() => setSegment('cancelled')}
            />
          </View>
          <Text style={styles.headerMeta}>{filteredRides.length} dispatches in view</Text>
        </View>
      </View>
      <FlatList
        data={filteredRides}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => <DispatchCard item={item} onPress={() => router.push(`/(driver)/rides/${item.id}`)} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState title="No dispatches" description="No dispatches match the selected state." />
        }
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={[
          filteredRides.length === 0 ? styles.emptyContent : styles.listContent,
          {
            paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
            paddingBottom: Spacing.xxxl,
          },
        ]}
      />
    </View>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
    >
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DispatchCard({ item, onPress }: { item: DriverPortalRideSummaryRecord; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.dispatchCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.dispatchTopRow}>
        <View style={styles.dispatchIdBlock}>
          <Text style={styles.dispatchCode}>{item.rideNumber}</Text>
          <Text style={styles.dispatchAddress} numberOfLines={1}>{item.pickupAddress ?? 'Pickup unavailable'}</Text>
          <Text style={styles.dispatchAddress} numberOfLines={1}>{item.dropoffAddress ?? 'Drop-off unavailable'}</Text>
        </View>
        <View style={styles.dispatchMetaBlock}>
          <Text style={styles.dispatchTime}>{formatShortDateTime(item.scheduledPickupAt)}</Text>
          <AppBadge status={item.status} />
        </View>
      </View>
      <Text style={styles.dispatchRider} numberOfLines={1}>{item.riderName}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerShell: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  header: {
    padding: Spacing.xl,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  segmentButtonSelected: {
    backgroundColor: DriverRoleTheme.primary,
    borderColor: DriverRoleTheme.primary,
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
  headerMeta: {
    marginTop: Spacing.sm,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dispatchCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginHorizontal: 0,
  },
  dispatchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  dispatchIdBlock: {
    flex: 1,
    gap: 2,
  },
  dispatchCode: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
  dispatchAddress: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dispatchMetaBlock: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  dispatchTime: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  dispatchRider: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  sep: { height: Spacing.md },
  listContent: { paddingTop: Spacing.sm },
  emptyContent: { flex: 1 },
});
