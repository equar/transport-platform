import { RequestError } from '@components/RequestError';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import React from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverRoutesPage() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['driver-routes'],
    queryFn: () => driverPortalApi.searchRoutes({ size: 50, sortBy: 'routeDate', sortDirection: 'ASC' }),
  });

  const routes = data?.items ?? [];

  if (isLoading) return <LoadingState />;
  if (isError) return <RequestError onRetry={() => void refetch()} />;

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
              {formatDate(item.routeDate)} · {item.linkedRideCount} linked rides
            </Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState title="No routes" description="No routes assigned to you." />
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={[{ padding: Spacing.lg, gap: Spacing.sm }, routes.length === 0 && styles.emptyContent]}
      />
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  card: { padding: Spacing.lg, gap: Spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeMd, color: colors.primary },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeLg, color: colors.textPrimary },
  meta: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textSecondary },
  sep: { height: Spacing.xs },
  emptyContent: { flex: 1 },
});
