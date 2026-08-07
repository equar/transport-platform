import React from 'react';
import { StyleSheet, FlatList, View, RefreshControl } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { RideCard } from '@components/RideCard';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing } from '@theme/tokens';

const PAGE_SIZE = 20;

export default function DriverRidesPage() {
  const router = useRouter();

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

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionHeader title="Ride Queue" subtitle="Your assigned rides" />
      </View>
      <FlatList
        data={rides}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <RideCard ride={item} onPress={() => router.push(`/(driver)/rides/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState title="No rides" description="No rides are currently assigned to you." />
        }
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
  sep: { height: Spacing.md },
  emptyContent: { flex: 1 },
});
