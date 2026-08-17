import React from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverRoutesPage() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-routes'],
    queryFn: () => driverPortalApi.searchRoutes({ size: 50, sort: 'routeDate,asc' }),
  });

  const routes = data?.items ?? [];

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionHeader title="Routes" subtitle="Your route manifests" />
      </View>
      <FlatList
        data={routes}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(driver)/routes/${item.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.row}>
              <Text style={styles.code}>{item.routeCode}</Text>
              <AppBadge status={item.status} />
            </View>
            <Text style={styles.name}>{item.routeName}</Text>
            <Text style={styles.meta}>
              {formatDate(item.routeDate)} · {item.linkedRideCount} stops
            </Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState title="No routes" description="No routes assigned to you." />
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={routes.length === 0 && styles.emptyContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  card: { padding: Spacing.lg, gap: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeMd, color: Colors.primary },
  name: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  sep: { height: 1, backgroundColor: Colors.divider },
  emptyContent: { flex: 1 },
});
