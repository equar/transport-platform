import React, { useState } from 'react';
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
  error?: boolean;
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
  error = false,
}: TripTrackingCardProps) {
  const [mapFailed, setMapFailed] = useState(false);
  const [details, setDetails] = useState(false);
  const ageMinutes = snapshot ? Math.max(0, Math.floor((Date.now() - Date.parse(snapshot.capturedAt)) / 60000)) : null;
  const mapUrl = snapshot ? buildStaticMapUrl(snapshot) : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.body}>
        {error ? <Text accessibilityRole="alert" style={styles.emptyText}>Location updates could not be loaded. Check your connection and refresh tracking.</Text> : null}
        {snapshot ? (
          <>
            {mapUrl && !mapFailed ? (
              <Image accessibilityLabel="Latest reported vehicle location" onError={() => setMapFailed(true)} source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
            ) : null}
            <Text style={styles.emptyText}>{ageMinutes != null && ageMinutes >= 2 ? `Location may be stale (${ageMinutes} minutes ago).` : 'Latest reported location'}</Text>
            {mapFailed ? <Text style={styles.emptyText}>Map unavailable. Open the location in Maps below.</Text> : null}
            {pickupAddress ? <Row label="Pickup" value={pickupAddress} /> : null}
            {dropoffAddress ? <Row label="Drop-off" value={dropoffAddress} /> : null}
            <Row label="Updated" value={new Date(snapshot.capturedAt).toLocaleString()} />
            <AppButton label={details ? "Hide location details" : "Location details"} variant="ghost" onPress={() => setDetails(!details)} />
            {details ? <>
            <Row label="Accuracy" value={snapshot.accuracyMeters != null ? `${snapshot.accuracyMeters.toFixed(1)} m` : '-'} />
            <Row label="Speed" value={formatSpeed(snapshot.speedMps)} />
            <Row
              label="Location"
              value={`${snapshot.latitude.toFixed(6)}, ${snapshot.longitude.toFixed(6)}`}
            />
            </> : null}
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
              Location appears during an active trip when your driver is sharing updates. Pull down or tap refresh for the latest report.
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
  section: { borderWidth: 1, borderColor: Colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surfaceMuted,
    textTransform: 'uppercase',
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: Colors.canvas,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    width: 72,
  },
  value: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
  },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
});
