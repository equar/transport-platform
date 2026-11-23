import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge, AppButton, AppCard } from './ui';
import { EmptyState } from './EmptyState';
import { SectionHeader } from './SectionHeader';
import { Spacing, Typography } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';
import { formatDate } from '@utils/formatDate';
import { requestErrorMessage } from '@utils/requestError';

export function DriverVehicles({ showHeading = true }: { showHeading?: boolean }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.3;
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    section: { gap: Spacing.md },
    card: { gap: Spacing.lg },
    identity: { gap: Spacing.sm },
    title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXl, color: colors.textPrimary, flexShrink: 1 },
    body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: colors.textPrimary, lineHeight: 23 },
    caption: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: colors.textSecondary, lineHeight: 21 },
    details: { gap: Spacing.md },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    stackedRow: { flexDirection: 'column', gap: Spacing.xs },
    label: { flex: 1, minWidth: 0, fontFamily: Typography.fontBody, fontSize: Typography.sizeSm, color: colors.textSecondary, lineHeight: 22 },
    value: { flex: 1, minWidth: 0, fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeMd, color: colors.textPrimary, textAlign: 'right', lineHeight: 23 },
    stackedText: { flex: undefined, textAlign: 'left', width: '100%' },
    documentSection: { gap: Spacing.md, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
    sectionTitle: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizeMd, color: colors.textPrimary },
  }), []));
  const query = useQuery({ queryKey: ['driver-vehicles'], queryFn: driverPortalApi.getVehicles });

  function detail(label: string, value: string) {
    return <View style={[styles.row, stacked && styles.stackedRow]}>
      <Text style={[styles.label, stacked && styles.stackedText]}>{label}</Text>
      <Text selectable style={[styles.value, stacked && styles.stackedText]}>{value}</Text>
    </View>;
  }
  const vehicles = [...(query.data ?? [])].sort((a, b) => Number(b.assignedToCurrentDriver) - Number(a.assignedToCurrentDriver));

  return <View style={styles.section}>
    {showHeading && <SectionHeader title="My vehicles" />}
    {query.isLoading ? <AppCard><Text accessibilityLiveRegion="polite" style={styles.body}>Loading vehicles…</Text></AppCard>
      : query.isError ? <AppCard style={styles.details}>
        <Text accessibilityRole="alert" style={styles.body}>{requestErrorMessage(query.error, 'Vehicles couldn’t be loaded. Try again.')}</Text>
        <AppButton label="Retry vehicles" variant="outlined" onPress={() => void query.refetch()} />
      </AppCard>
        : !vehicles.length ? <AppCard><EmptyState title="No vehicles linked yet" description="Contact your transport provider to register your vehicle or update an assignment." /></AppCard>
          : vehicles.map(vehicle => <AppCard key={vehicle.id} style={styles.card}>
            <View style={styles.identity}>
              <Text style={styles.caption}>{vehicle.vehicleCode}</Text>
              <Text accessibilityRole="header" style={styles.title}>{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}</Text>
              <AppBadge status={vehicle.status} />
              <Text style={styles.caption}>{vehicle.assignedToCurrentDriver ? 'Currently assigned to you'
                : vehicle.ownedByCurrentDriver ? 'Owned by you; not currently assigned to you' : 'Not currently assigned to you'}</Text>
            </View>
            <View style={styles.details}>
              {detail('License plate', [vehicle.plateNumber, vehicle.plateState].filter(Boolean).join(' · ') || 'Not provided')}
              {detail('Ownership', vehicle.ownedByCurrentDriver ? 'Owned by you' : vehicle.ownershipType === 'COMPANY_OWNED' ? 'Company owned' : vehicle.ownershipType === 'LEASED' ? 'Leased' : 'Driver owned')}
              {detail('Passenger seats', vehicle.capacity == null ? 'Not provided' : String(vehicle.capacity))}
              {detail('Wheelchair spaces', String(vehicle.wheelchairCapacity ?? 0))}
            </View>
            <View style={styles.documentSection}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Document expiry</Text>
              {detail('Insurance', vehicle.insuranceExpiryDate ? formatDate(vehicle.insuranceExpiryDate) : 'Not provided')}
              {detail('Registration', vehicle.registrationExpiryDate ? formatDate(vehicle.registrationExpiryDate) : 'Not provided')}
              {detail('Inspection', vehicle.inspectionExpiryDate ? formatDate(vehicle.inspectionExpiryDate) : 'Not provided')}
            </View>
          </AppCard>)}
    {!!query.data?.length && <AppButton label="Refresh vehicles" variant="outlined" loading={query.isRefetching} onPress={() => void query.refetch()} />}
  </View>;
}
