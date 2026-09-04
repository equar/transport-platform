import React from 'react';
import { Alert, StyleSheet, ScrollView, Text, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppButton, AppCard, AppInput } from '@components/ui';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { PassengerRoleTheme } from '@theme/roleTheme';
import { riderPortalApi } from '@api/riderPortalApi';

type ServiceType =
  | 'GENERAL_TRANSPORT'
  | 'SCHOOL_TRANSPORT'
  | 'NEMT'
  | 'DIALYSIS'
  | 'EMPLOYER_COMMUTER'
  | 'ADA_PARATRANSIT'
  | 'SHUTTLE'
  | 'OTHER';

type TripType = 'ONE_WAY' | 'ROUND_TRIP';

interface FormState {
  pickupAddressLine1: string;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupCountry: string;
  dropoffAddressLine1: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffZipCode: string;
  dropoffCountry: string;
  scheduledPickupAt: string;
  specialInstructions: string;
  companionCount: string;
}

const SERVICE_OPTIONS: Array<{ label: string; value: ServiceType }> = [
  { label: 'School', value: 'SCHOOL_TRANSPORT' },
  { label: 'Medical', value: 'NEMT' },
  { label: 'General', value: 'GENERAL_TRANSPORT' },
  { label: 'Shuttle', value: 'SHUTTLE' },
];

export default function RiderSchedulePage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const qc = useQueryClient();
  const [tripType, setTripType] = React.useState<TripType>('ONE_WAY');
  const [serviceType, setServiceType] = React.useState<ServiceType>('SCHOOL_TRANSPORT');
  const [form, setForm] = React.useState<FormState>({
    pickupAddressLine1: '',
    pickupCity: '',
    pickupState: '',
    pickupZipCode: '',
    pickupCountry: 'USA',
    dropoffAddressLine1: '',
    dropoffCity: '',
    dropoffState: '',
    dropoffZipCode: '',
    dropoffCountry: 'USA',
    scheduledPickupAt: '',
    specialInstructions: '',
    companionCount: '0',
  });

  const { mutate: createRide, isPending } = useMutation({
    mutationFn: () => {
      const payload = buildPayload(form, serviceType, tripType);
      return riderPortalApi.createRide(payload);
    },
    onSuccess: (ride) => {
      qc.invalidateQueries({ queryKey: ['rider-rides'] });
      qc.invalidateQueries({ queryKey: ['rider-next-rides'] });
      qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
      Alert.alert('Ride Requested', `Ride ${ride.rideNumber} was created.`, [
        { text: 'OK', onPress: () => router.push(`/(rider)/rides/${ride.id}`) },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Unable to Request Ride', error.message);
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const validationError = validateForm(form);
    if (validationError) {
      Alert.alert('Missing Information', validationError);
      return;
    }
    createRide();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
          gap: isCompact ? Spacing.sm : Spacing.md,
        },
      ]}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Schedule a Ride</Text>
        <Text style={styles.heroSubtitle}>Create your next transportation request.</Text>
      </View>

      <AppCard>
        <SectionHeader title="Trip Type" />
        <View style={styles.optionRow}>
          <OptionPill label="One Way" active={tripType === 'ONE_WAY'} onPress={() => setTripType('ONE_WAY')} />
          <OptionPill label="Round Trip" active={tripType === 'ROUND_TRIP'} onPress={() => setTripType('ROUND_TRIP')} />
        </View>
      </AppCard>

      <AppCard>
        <SectionHeader title="Service" />
        <View style={styles.optionRowWrap}>
          {SERVICE_OPTIONS.map((option) => (
            <OptionPill
              key={option.value}
              label={option.label}
              active={serviceType === option.value}
              onPress={() => setServiceType(option.value)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionHeader title="From" />
        <View style={styles.fields}>
          <AppInput label="Address" value={form.pickupAddressLine1} onChangeText={(v) => update('pickupAddressLine1', v)} placeholder="123 Main St" autoCapitalize="words" />
          <AppInput label="City" value={form.pickupCity} onChangeText={(v) => update('pickupCity', v)} placeholder="Springfield" autoCapitalize="words" />
          <View style={[styles.splitRow, isCompact && styles.splitRowCompact]}>
            <AppInput style={styles.splitInput} label="State" value={form.pickupState} onChangeText={(v) => update('pickupState', v)} placeholder="CA" autoCapitalize="characters" />
            <AppInput style={styles.splitInput} label="Zip" value={form.pickupZipCode} onChangeText={(v) => update('pickupZipCode', v)} placeholder="90210" keyboardType="numeric" />
          </View>
          <AppInput label="Country" value={form.pickupCountry} onChangeText={(v) => update('pickupCountry', v)} placeholder="USA" autoCapitalize="words" />
        </View>
      </AppCard>

      <AppCard>
        <SectionHeader title="To" />
        <View style={styles.fields}>
          <AppInput label="Address" value={form.dropoffAddressLine1} onChangeText={(v) => update('dropoffAddressLine1', v)} placeholder="456 Oak Ave" autoCapitalize="words" />
          <AppInput label="City" value={form.dropoffCity} onChangeText={(v) => update('dropoffCity', v)} placeholder="Springfield" autoCapitalize="words" />
          <View style={[styles.splitRow, isCompact && styles.splitRowCompact]}>
            <AppInput style={styles.splitInput} label="State" value={form.dropoffState} onChangeText={(v) => update('dropoffState', v)} placeholder="CA" autoCapitalize="characters" />
            <AppInput style={styles.splitInput} label="Zip" value={form.dropoffZipCode} onChangeText={(v) => update('dropoffZipCode', v)} placeholder="90210" keyboardType="numeric" />
          </View>
          <AppInput label="Country" value={form.dropoffCountry} onChangeText={(v) => update('dropoffCountry', v)} placeholder="USA" autoCapitalize="words" />
        </View>
      </AppCard>

      <AppCard>
        <SectionHeader title="Pickup Time" subtitle="Use local ISO format: 2026-09-03T08:30:00" />
        <View style={styles.fields}>
          <AppInput
            label="Scheduled Pickup"
            value={form.scheduledPickupAt}
            onChangeText={(v) => update('scheduledPickupAt', v)}
            placeholder="2026-09-03T08:30:00"
            autoCapitalize="none"
          />
          <AppInput
            label="Companions"
            value={form.companionCount}
            onChangeText={(v) => update('companionCount', v)}
            placeholder="0"
            keyboardType="numeric"
          />
          <AppInput
            label="Special Instructions"
            value={form.specialInstructions}
            onChangeText={(v) => update('specialInstructions', v)}
            placeholder="Optional notes for dispatch"
            autoCapitalize="sentences"
            multiline
            numberOfLines={4}
          />
        </View>
      </AppCard>

      <AppButton label="Request Ride" fullWidth onPress={submit} loading={isPending} />
      <Text style={styles.note}>If multiple riders are linked, backend may require rider selection. This version submits for the current rider scope.</Text>
    </ScrollView>
  );
}

function OptionPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function validateForm(form: FormState): string | null {
  if (!form.pickupAddressLine1.trim()) return 'Pickup address is required.';
  if (!form.pickupCity.trim()) return 'Pickup city is required.';
  if (!form.pickupState.trim()) return 'Pickup state is required.';
  if (!form.pickupZipCode.trim()) return 'Pickup zip code is required.';
  if (!form.pickupCountry.trim()) return 'Pickup country is required.';
  if (!form.dropoffAddressLine1.trim()) return 'Drop-off address is required.';
  if (!form.dropoffCity.trim()) return 'Drop-off city is required.';
  if (!form.dropoffState.trim()) return 'Drop-off state is required.';
  if (!form.dropoffZipCode.trim()) return 'Drop-off zip code is required.';
  if (!form.dropoffCountry.trim()) return 'Drop-off country is required.';
  if (!form.scheduledPickupAt.trim()) return 'Scheduled pickup time is required.';
  if (Number.isNaN(Date.parse(form.scheduledPickupAt.trim()))) {
    return 'Scheduled pickup must be a valid ISO local datetime, e.g. 2026-09-03T08:30:00.';
  }
  const companions = Number(form.companionCount || '0');
  if (!Number.isFinite(companions) || companions < 0 || companions > 10) {
    return 'Companions must be a number from 0 to 10.';
  }
  return null;
}

function buildPayload(form: FormState, serviceType: ServiceType, tripType: TripType) {
  return {
    serviceType,
    tripType,
    pickupAddressLine1: form.pickupAddressLine1.trim(),
    pickupCity: form.pickupCity.trim(),
    pickupState: form.pickupState.trim(),
    pickupZipCode: form.pickupZipCode.trim(),
    pickupCountry: form.pickupCountry.trim(),
    dropoffAddressLine1: form.dropoffAddressLine1.trim(),
    dropoffCity: form.dropoffCity.trim(),
    dropoffState: form.dropoffState.trim(),
    dropoffZipCode: form.dropoffZipCode.trim(),
    dropoffCountry: form.dropoffCountry.trim(),
    scheduledPickupAt: form.scheduledPickupAt.trim(),
    companionCount: Number(form.companionCount || '0'),
    specialInstructions: form.specialInstructions.trim() || undefined,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  hero: {
    backgroundColor: PassengerRoleTheme.primary,
    borderRadius: 8,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.white,
  },
  heroSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.white,
    opacity: 0.9,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    borderColor: PassengerRoleTheme.primary,
    backgroundColor: PassengerRoleTheme.primary,
  },
  pillLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  pillLabelActive: {
    color: Colors.white,
  },
  fields: {
    gap: Spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  splitRowCompact: {
    flexDirection: 'column',
  },
  splitInput: {
    flex: 1,
  },
  note: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
