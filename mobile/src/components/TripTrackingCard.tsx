import React from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';

interface TripTrackingCardProps {
  title?: string;
  snapshot: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    speedMps?: number | null;
    capturedAt: string;
  } | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function buildStaticMapUrl(
  snapshot: NonNullable<TripTrackingCardProps['snapshot']>,
) {
  const latitude = Number(snapshot.latitude);
  const longitude = Number(snapshot.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=14&size=1200x600&markers=${latitude},${longitude},red-pushpin`;
}

function formatSpeed(speedMps?: number | null) {
  if (speedMps == null) return '-';
  return `${(speedMps * 3.6).toFixed(1)} km/h`;
}

export function TripTrackingCard({
  title = 'Route Tracking',
  snapshot,
  pickupAddress,
  dropoffAddress,
  onRefresh,
  refreshing = false,
}: TripTrackingCardProps) {
  const mapUrl = snapshot ? buildStaticMapUrl(snapshot) : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.body}>
        {snapshot ? (
          <>
            {mapUrl ? (
              <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
            ) : null}
            <Row label="Updated" value={new Date(snapshot.capturedAt).toLocaleString()} />
            <Row label="Accuracy" value={snapshot.accuracyMeters != null ? `${snapshot.accuracyMeters.toFixed(1)} m` : '-'} />
            <Row label="Speed" value={formatSpeed(snapshot.speedMps)} />
            <Row
              label="Location"
              value={`${snapshot.latitude.toFixed(6)}, ${snapshot.longitude.toFixed(6)}`}
            />
            <View style={styles.actions}>
              <AppButton
                label="Open in Maps"
                variant="outlined"
                onPress={() => void Linking.openURL(`https://maps.google.com/?q=${snapshot.latitude},${snapshot.longitude}`)}
                fullWidth
              />
              {onRefresh ? (
                <AppButton
                  label="Refresh Tracking"
                  onPress={onRefresh}
                  loading={refreshing}
                  fullWidth
                />
              ) : null}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.emptyText}>
              No live route snapshot is available yet for this trip.
            </Text>
            {onRefresh ? (
              <AppButton
                label="Refresh Tracking"
                onPress={onRefresh}
                loading={refreshing}
                fullWidth
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderWidth: 1, borderColor: Colors.border },
  sectionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: '#fafafa',
    textTransform: 'uppercase',
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#dfe5e8',
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    width: 72,
  },
  value: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  emptyText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
});
