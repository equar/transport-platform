import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge } from '@components/ui';
import { RouteStopCard } from '@components/RouteStopCard';
import { LoadingState } from '@components/LoadingState';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverRouteDetailPage() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const router = useRouter();

  const { data: route, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-route', routeId],
    queryFn: () => driverPortalApi.getRoute(Number(routeId)),
    enabled: !!routeId,
  });

  if (isLoading || !route) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.back} onPress={() => router.back()}>← Routes</Text>

      <View style={styles.headerRow}>
        <Text style={styles.code}>{route.routeCode}</Text>
        <AppBadge status={route.status} />
      </View>
      <Text style={styles.name}>{route.routeName}</Text>
      <Text style={styles.meta}>{formatDate(route.routeDate)} · {route.linkedRideCount} stops</Text>

      {route.manifestNotes ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Manifest Notes</Text>
          <Text style={styles.notesText}>{route.manifestNotes}</Text>
        </View>
      ) : null}

      <Text style={styles.stopsHeading}>Stops</Text>
      {route.stops.map((stop, i) => (
        <RouteStopCard key={stop.id} stop={stop} isLast={i === route.stops.length - 1} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  back: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.primary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXxl, color: Colors.textPrimary },
  name: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  notes: { borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.xs },
  notesLabel: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeXs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  stopsHeading: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
});
