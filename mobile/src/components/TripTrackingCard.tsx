import React, { useState } from 'react';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
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
  const mapRegion = validLocation ? {
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  } : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.body}>
        {error ? <Text accessibilityRole="alert" style={styles.emptyText}>Location updates could not be loaded. Check your connection and refresh tracking.</Text> : null}
        {snapshot ? (
          <>
            {validLocation && !mapVisible ? <AppButton label="Show map" variant="outlined" onPress={() => setShowMap(true)} /> : null}
            {mapVisible && validLocation ? (
              <Text style={styles.emptyText}>
                {riderPickedUp
                  ? 'The pin shows the rider traveling with the assigned driver.'
                  : 'The pin shows the assigned driver’s latest reported location.'}
              </Text>
            ) : null}
            {mapVisible && mapRegion && snapshot ? (
              <MapView
                accessibilityLabel="Map showing the latest shared ride location"
                testID="ride-location-map"
                style={styles.map}
                region={mapRegion}
                mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                showsUserLocation={false}
                showsCompass
                zoomEnabled
                scrollEnabled
              >
                <UrlTile
                  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  shouldReplaceMapContent={Platform.OS === 'ios'}
                />
                <Marker
                  coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
                  title={riderPickedUp ? 'Rider and assigned driver' : 'Assigned driver'}
                  description={riderPickedUp
                    ? 'The rider is traveling with the driver.'
                    : 'Latest location reported by the assigned driver.'}
                />
              </MapView>
            ) : null}
            {mapVisible && !validLocation ? <Text style={styles.emptyText}>The latest location cannot be shown on the map.</Text> : null}
            {mapVisible ? <Text style={styles.emptyText}>© OpenStreetMap contributors</Text> : null}
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
            {onRefresh ? (
              <AppButton
                label="Refresh Tracking"
                onPress={onRefresh}
                loading={refreshing}
                fullWidth
              />
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.emptyText}>
              Waiting for the driver’s first location update. The map pin will appear when location sharing is active and the driver’s app has a connection.
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
