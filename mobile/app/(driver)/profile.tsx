import { DriverVehicles } from '@components/DriverVehicles';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { AccountActions } from '@components/AccountActions';
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
import { useRouter } from 'expo-router';
import { driverPortalApi } from '@api/driverPortalApi';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { EmptyState } from '@components/EmptyState';
import { AppButton, AppCard } from '@components/ui';
import { Spacing, Typography } from '@theme/tokens';

type ProfileTab = 'driver' | 'vehicle';

export default function DriverProfilePage() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
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
            actionLabel="Try again" onAction={() => void refetch()}
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
            <AppButton
              label="Upload driving license"
              variant="outlined"
              leftIcon="card-account-details-outline"
              onPress={() => router.push('/(driver)/compliance')}
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
          <DriverVehicles />
        </>
      )}
    <AccountActions />
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
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const rowStyles = useThemedStyles(createRowStyles);
  const styles = useThemedStyles(createStyles);
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  hero: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
  },
  heroName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: colors.textPrimary,
  },
  heroMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
    opacity: 0.9,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48, justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabLabel: {
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.secondaryDark,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeMd,
    color: colors.textPrimary,
  },
});

const createRowStyles = (colors: BrandColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: colors.textSecondary,
    width: 100,
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: colors.textPrimary,
    flex: 1,
  },
});
