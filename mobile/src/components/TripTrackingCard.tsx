import React, { useState, useEffect } from 'react';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@components/ui';
import { Spacing, Typography } from '@theme/tokens';

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
  autoShowMap?: boolean;
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
  autoShowMap = false,
}: TripTrackingCardProps) {
  const styles = useThemedStyles(createStyles);
  const [mapFailed, setMapFailed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  useEffect(() => { setMapFailed(false); }, [snapshot?.capturedAt]);
  const [details, setDetails] = useState(false);
  const ageMinutes = snapshot ? Math.max(0, Math.floor((Date.now() - Date.parse(snapshot.capturedAt)) / 60000)) : null;
  const mapUrl = snapshot ? buildStaticMapUrl(snapshot) : null;
  const mapVisible = autoShowMap || showMap;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.body}>
        {error ? <Text accessibilityRole="alert" style={styles.emptyText}>Location updates could not be loaded. Check your connection and refresh tracking.</Text> : null}
        {snapshot ? (
          <>
            {mapUrl && !autoShowMap && !showMap ? <AppButton label="Show map" variant="outlined" accessibilityHint="Shares this reported location with the map provider" onPress={() => setShowMap(true)} /> : null}
            {mapUrl && !mapVisible ? <Text style={styles.emptyText}>Showing a map shares this location with the map provider.</Text> : null}
            {mapUrl && mapVisible ? <Text style={styles.emptyText}>The pin shows the assigned driver’s latest reported location. It indicates the rider’s location only after pickup. Map data is provided by OpenStreetMap.</Text> : null}
            {mapUrl && mapVisible && !mapFailed ? (
              <Image accessibilityLabel="Latest reported driver location" onError={() => setMapFailed(true)} source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
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
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surfaceMuted,
    textTransform: 'uppercase',
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: colors.canvas,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
    width: 72,
  },
  value: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
});
