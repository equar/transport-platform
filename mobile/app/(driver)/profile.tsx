import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { EmptyState } from '@components/EmptyState';
import { AppCard } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { DriverRoleTheme } from '@theme/roleTheme';

type ProfileTab = 'driver' | 'vehicle';

export default function DriverProfilePage() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [tab, setTab] = React.useState<ProfileTab>('driver');

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverPortalApi.getProfile(),
  });

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
          gap: isCompact ? Spacing.md : Spacing.lg,
        },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Profile</Text>
        <Text style={styles.heroName}>
          {profile ? `${profile.firstName} ${profile.lastName}` : 'Driver Account'}
        </Text>
        <Text style={styles.heroMeta}>{profile?.email ?? 'No email on file'}</Text>
      </View>

      <View style={styles.tabRow}>
        <TabButton
          label="Driver Details"
          active={tab === 'driver'}
          onPress={() => setTab('driver')}
        />
        <TabButton
          label="Vehicle Details"
          active={tab === 'vehicle'}
          onPress={() => setTab('vehicle')}
        />
      </View>

      {isError ? (
        <AppCard>
          <EmptyState
            title="Unable to load profile"
            description={
              error instanceof Error
                ? error.message
                : 'Please pull to refresh and try again.'
            }
          />
        </AppCard>
      ) : !profile ? (
        <AppCard>
          <EmptyState
            title="Profile unavailable"
            description="No driver profile data was returned yet. Pull down to refresh."
          />
        </AppCard>
      ) : tab === 'driver' ? (
        <>
          <SectionHeader title="Driver Details" subtitle={profile.driverCode} />

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Row label="Name" value={`${profile.firstName} ${profile.lastName}`} />
            <Row label="Email" value={profile.email ?? '—'} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Status" value={profile.status} />
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Qualifications</Text>
            <Row label="License Exp." value={profile.licenseExpiryDate ?? '—'} />
            <Row
              label="Background"
              value={profile.backgroundCheckExpiryDate ?? '—'}
            />
            <Row label="Drug Test" value={profile.drugTestExpiryDate ?? '—'} />
            <Row
              label="Training"
              value={profile.trainingCompletionDate ?? '—'}
            />
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Row label="Name" value={profile.emergencyContactName ?? '—'} />
            <Row label="Phone" value={profile.emergencyContactPhone ?? '—'} />
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Text style={styles.note}>{profile.availabilitySummary || 'Not set'}</Text>
          </AppCard>
        </>
      ) : (
        <>
          <SectionHeader title="Vehicle Details" subtitle="Assigned fleet and readiness" />

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Fleet Assignment</Text>
            <Row label="Vehicle Type" value="Van (Company Owned)" />
            <Row label="Plate Number" value="Assigned by dispatch" />
            <Row label="Capacity" value="16 seats" />
            <Row label="Fuel Type" value="Gasoline" />
            <Row label="Status" value="Ready" />
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Operations</Text>
            <Text style={styles.note}>
              Contact dispatch from Messages for maintenance updates, temporary
              reassignment, or pre-trip checklist notes.
            </Text>
          </AppCard>
        </>
      )}
    </ScrollView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  hero: {
    backgroundColor: DriverRoleTheme.primary,
    borderRadius: 8,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.white,
  },
  heroName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.white,
  },
  heroMeta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.white,
    opacity: 0.9,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  tabButtonActive: {
    backgroundColor: DriverRoleTheme.primary,
    borderColor: DriverRoleTheme.primary,
  },
  tabLabel: {
    textAlign: 'center',
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.white,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  note: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textPrimary,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    width: 100,
  },
  value: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
    flex: 1,
  },
});
