import { RequestError } from '@components/RequestError';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import React from 'react';
import { StyleSheet, FlatList, View, RefreshControl, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi, type DriverPortalRideSummaryRecord } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { AppBadge, AppButton } from '@components/ui';
import { Shadow, Spacing, Typography } from '@theme/tokens';
import { formatShortDateTime } from '@utils/formatDate';

const PAGE_SIZE = 20;
type DispatchSegment = 'assigned' | 'completed' | 'cancelled';

const STATUS_SEGMENTS: Record<DispatchSegment, string[]> = {
  assigned: ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'PICKED_UP'],
  completed: ['DROPPED_OFF', 'COMPLETED'],
  cancelled: ['CANCELLED', 'MISSED', 'FAILED', 'RIDER_NO_SHOW'],
};

export default function DriverRidesPage() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [segment, setSegment] = React.useState<DispatchSegment>('assigned');

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['driver-rides'],
      queryFn: ({ pageParam = 0 }) =>
        driverPortalApi.searchRides({ page: pageParam, size: PAGE_SIZE, sortBy: 'scheduledPickupAt', sortDirection: 'ASC' }),
      getNextPageParam: (last, pages) =>
        last.page + 1 < last.totalPages ? pages.length : undefined,
      initialPageParam: 0,
    });

  const rides = data?.pages.flatMap((p) => p.items) ?? [];
  const filteredRides = rides.filter((ride) => STATUS_SEGMENTS[segment].includes(ride.status));

  if (isLoading) return <LoadingState />;
  if (isError && !data) return <RequestError onRetry={() => void refetch()} />;

  return (
    <View style={styles.container}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <SectionHeader title="Your trips" subtitle="Assignments, completed trips and cancellations" />
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
          <EmptyState title="No dispatches" description="No matching trips in the loaded records. Load more below or pull down to refresh." />
        }
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={hasNextPage ? <AppButton label="Load more trips" variant="outlined" loading={isFetchingNextPage} onPress={() => void fetchNextPage()} /> : null}
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
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity
      accessibilityRole="tab" accessibilityState={{ selected }}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
    >
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DispatchCard({ item, onPress }: { item: DriverPortalRideSummaryRecord; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity style={styles.dispatchCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.dispatchTopRow}>
        <View style={styles.dispatchIdBlock}>
          <Text style={styles.dispatchCode}>{item.rideNumber}</Text>
          <Text style={styles.dispatchAddress} numberOfLines={2}>{item.pickupAddress ?? 'Pickup unavailable'}</Text>
          <Text style={styles.dispatchAddress} numberOfLines={2}>{item.dropoffAddress ?? 'Drop-off unavailable'}</Text>
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

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerShell: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  header: {
    padding: Spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.soft,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  segmentButton: {
    flex: 1,
    minHeight: 48, justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
  },
  segmentButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentLabel: {
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  segmentLabelSelected: {
    color: colors.secondaryDark,
  },
  headerMeta: {
    marginTop: Spacing.sm,
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  dispatchCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
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
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeMd,
    color: colors.textPrimary,
  },
  dispatchAddress: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  dispatchMetaBlock: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  dispatchTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  dispatchRider: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  sep: { height: Spacing.md },
  listContent: { paddingTop: Spacing.sm },
  emptyContent: { flex: 1 },
});
