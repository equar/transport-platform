import { EmptyState } from '@components/EmptyState';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { RequestError } from '@components/RequestError';
import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge } from '@components/ui';
import { RouteStopCard } from '@components/RouteStopCard';
import { LoadingState } from '@components/LoadingState';
import { Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverRouteDetailPage() {
  const styles = useThemedStyles(createStyles);
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const router = useRouter();

  const { data: route, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['driver-route', routeId],
    queryFn: () => driverPortalApi.getRoute(Number(routeId)),
    enabled: !!routeId,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !route) return <RequestError onRetry={() => void refetch()} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text accessibilityRole="button" style={[styles.back, { minHeight: 48, paddingVertical: 12 }]} onPress={() => router.back()}>← Routes</Text>

      <View style={styles.headerRow}>
        <Text style={styles.code}>{route.routeCode}</Text>
        <AppBadge status={route.status} />
      </View>
      <Text style={styles.name}>{route.routeName}</Text>
      <Text style={styles.meta}>{formatDate(route.routeDate)} · {route.linkedRideCount} linked rides</Text>

      {route.manifestNotes ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Manifest Notes</Text>
          <Text style={styles.notesText}>{route.manifestNotes}</Text>
        </View>
      ) : null}

      <Text style={styles.stopsHeading}>Stops</Text>
      {route.stops.length === 0 && <EmptyState title="No stops listed" description="Contact dispatch if your manifest is incomplete." />}
      {route.stops.map((stop, i) => (
        <RouteStopCard key={stop.id} stop={stop} isLast={i === route.stops.length - 1} />
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  back: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeSm, color: colors.primary },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeXxl, color: colors.textPrimary },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeLg, color: colors.textPrimary },
  meta: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textSecondary },
  notes: { borderWidth: 1, borderColor: colors.border, padding: Spacing.md, gap: Spacing.xs },
  notesLabel: { fontFamily: 'Inter_700Bold', fontSize: Typography.sizeXs, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeMd, color: colors.textPrimary },
  stopsHeading: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeLg, color: colors.textPrimary },
});
