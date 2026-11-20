import { travelledPathSegments, travelledPathRegion, type TravelledPoint } from '@utils/travelledPath';
import React, { useState } from 'react';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { AppButton } from '@components/ui';
import { Spacing, Typography } from '@theme/tokens';

interface TripTrackingCardProps {
  title?: string;
  history?: TravelledPoint[];
  historyError?: boolean;
  snapshot: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    speedMps?: number | null;
    capturedAt: string;
  } | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  rideStatus?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  error?: boolean;
  autoShowMap?: boolean;
}

function isValidLocation(snapshot: NonNullable<TripTrackingCardProps['snapshot']>) {
  return Number.isFinite(snapshot.latitude)
    && Number.isFinite(snapshot.longitude)
    && snapshot.latitude >= -90
    && snapshot.latitude <= 90
    && snapshot.longitude >= -180
    && snapshot.longitude <= 180;
}

function formatSpeed(speedMps?: number | null) {
  if (speedMps == null) return '-';
  return `${(speedMps * 3.6).toFixed(1)} km/h`;
}

export function TripTrackingCard({
  title = 'Route Tracking',
  history = [],
  historyError = false,
  snapshot,
  pickupAddress,
  dropoffAddress,
  rideStatus,
  onRefresh,
  refreshing = false,
  error = false,
  autoShowMap = false,
}: TripTrackingCardProps) {
  const styles = useThemedStyles(createStyles);
  const [showMap, setShowMap] = useState(false);
  const [details, setDetails] = useState(false);
  const ageMinutes = snapshot ? Math.max(0, Math.floor((Date.now() - Date.parse(snapshot.capturedAt)) / 60000)) : null;
  const validLocation = snapshot != null && isValidLocation(snapshot);
  const mapVisible = autoShowMap || showMap;
  const riderPickedUp = rideStatus === 'PICKED_UP';
  const segments = travelledPathSegments(history);
  const pathPoints = segments.flat();
  const mapRegion = travelledPathRegion([...pathPoints, ...(validLocation && snapshot ? [snapshot] : [])]);

  const refreshControl = onRefresh ? (
    <AppButton
      label="Refresh"
      accessibilityLabel="Refresh Tracking"
      onPress={onRefresh}
      loading={refreshing}
      variant="outlined"
      size="sm"
    />
  ) : null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!mapVisible ? refreshControl : null}
      </View>
      <View style={styles.body}>
        {mapVisible ? (
          <View style={styles.mapContainer}>
          <MapView
            accessibilityLabel="Map showing the latest shared ride location"
            testID="ride-location-map"
            style={styles.map}
            region={mapRegion}
            mapType="standard"
            showsUserLocation={false}
            showsCompass
            zoomEnabled
            scrollEnabled
          >
            {segments.map((segment, index) => <Polyline
              key={`travelled-${index}`}
              coordinates={segment.map(point => ({ latitude: point.latitude, longitude: point.longitude }))}
              strokeColor={styles.path.color}
              strokeWidth={4}
            />)}
            {validLocation && snapshot ? <Marker
              coordinate={{ latitude: snapshot.latitude, longitude: snapshot.longitude }}
              title={riderPickedUp ? 'Rider and assigned driver' : 'Assigned driver'}
              description={riderPickedUp
                ? 'The rider is traveling with the driver.'
                : 'Latest location reported by the assigned driver.'}
            /> : null}
          </MapView>
          {onRefresh ? <View style={styles.mapRefresh}>{refreshControl}</View> : null}
          </View>
        ) : null}
        {mapVisible ? <Text style={styles.emptyText}>
          {historyError ? 'The recorded path could not be loaded. Press Refresh to try again.'
            : segments.length ? 'Recorded path travelled (up to the latest 1,000 GPS reports). Gaps indicate missing location reports.'
            : 'The travelled path will appear once enough reliable GPS reports are recorded.'}
        </Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.emptyText}>Location updates could not be loaded. Check your connection and refresh tracking.</Text> : null}
        {snapshot ? (
          <>
            {validLocation && !mapVisible ? <AppButton label="Show map" variant="outlined" onPress={() => setShowMap(true)} /> : null}
            {mapVisible && validLocation ? (
              <Text style={styles.emptyText}>
                {riderPickedUp
                  ? 'The rider is on board. The pin shows the assigned driver’s latest reported location.'
                  : 'The pin shows the assigned driver’s latest reported location.'}
              </Text>
            ) : null}
            {mapVisible && !validLocation ? <Text style={styles.emptyText}>The latest location cannot be shown on the map.</Text> : null}
            <Text style={styles.emptyText}>{ageMinutes != null && ageMinutes >= 2 ? `Location may be stale (${ageMinutes} minutes ago).` : 'Latest reported location'}</Text>
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
          </>
        ) : (
          <>
            <Text style={styles.emptyText}>
              Waiting for the driver’s first location update. The map pin will appear when location sharing is active and the driver’s app has a connection.
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surfaceMuted,
  },
  path: { color: colors.primary },
  mapContainer: { position: 'relative' },
  mapRefresh: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  sectionTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeXs,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  map: {
    width: '100%',
    height: 280,
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
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
});
