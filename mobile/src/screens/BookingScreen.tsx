import { runtimeApi } from '@api/runtimeApi';
import { createIdempotencyKey } from '@utils/idempotencyKey';
import React from 'react';
import { Alert, StyleSheet, ScrollView, Text, View, Switch, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppButton, AppCard, AppInput } from '@components/ui';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { PassengerRoleTheme } from '@theme/roleTheme';
import { useAuth } from '@auth/AuthContext';
import { DateTimeField } from '@components/DateTimeField';
import { riderPortalApi } from '@api/riderPortalApi';

type ServiceType = import('@api/generated/contracts').RiderGuardianPortalRideCreateRequest['serviceType'];
type TripType = import('@api/generated/contracts').RiderGuardianPortalRideCreateRequest['tripType'];

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
  returnPickupAt: string;
  returnDropoffAt: string;
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
  const requestKey = React.useRef(createIdempotencyKey("booking"));
  const router = useRouter();
  const { session } = useAuth();
  const guardian = session?.identity.roles.includes('ROLE_GUARDIAN');
  const scope = guardian ? 'guardian' : 'rider';
  const { data: capabilities } = useQuery({ queryKey: ["booking-capabilities"], queryFn: runtimeApi.capabilities });
  const [riderId, setRiderId] = React.useState<number | undefined>();
  const [wheelchairRequired, setWheelchairRequired] = React.useState(false);
  const [escortRequired, setEscortRequired] = React.useState(false);
  const { data: riders, isError: ridersError, refetch: retryRiders } = useQuery({ queryKey: ['booking-riders'], queryFn: riderPortalApi.getLinkedRiders, enabled: !!guardian });
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const qc = useQueryClient();
  const [tripType, setTripType] = React.useState<TripType>('ONE_WAY');
  const [serviceType, setServiceType] = React.useState<ServiceType>('GENERAL_TRANSPORT');
  const [form, setForm] = React.useState<FormState>({
    pickupAddressLine1: '',
    pickupCity: '',
    pickupState: '',
    pickupZipCode: '',
    pickupCountry: 'US',
    dropoffAddressLine1: '',
    dropoffCity: '',
    dropoffState: '',
    dropoffZipCode: '',
    dropoffCountry: 'US',
    scheduledPickupAt: '',
    returnPickupAt: '',
    returnDropoffAt: '',
    specialInstructions: '',
    companionCount: '0',
  });

  const { data: locations } = useQuery({ queryKey: ['booking-locations', riderId], queryFn: () => riderPortalApi.savedLocations(riderId), enabled: !guardian || !!riderId });
  function useLocation(side: 'pickup' | 'dropoff', location: NonNullable<typeof locations>[number]) {
    requestKey.current = createIdempotencyKey('booking');
    setForm(previous => ({ ...previous,
      [`${side}AddressLine1`]: location.addressLine1, [`${side}City`]: location.city,
      [`${side}State`]: location.state, [`${side}ZipCode`]: location.zipCode, [`${side}Country`]: location.country,
    }));
  }
  const { mutate: createRide, isPending } = useMutation({
    mutationFn: () => {
      const payload = { ...buildPayload(form, serviceType, tripType), riderId, wheelchairRequired, escortRequired };
      return riderPortalApi.createRide(payload, requestKey.current);
    },
    onSuccess: (ride) => {
      qc.invalidateQueries();
      qc.invalidateQueries({ queryKey: ['rider-next-rides'] });
      qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
      Alert.alert('Ride Requested', `Ride ${ride.rideNumber} was created.`, [
        { text: 'OK', onPress: () => router.push(`/(${scope})/rides/${ride.id}` as never) },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Unable to Request Ride', error.message);
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    requestKey.current = createIdempotencyKey("booking");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  React.useEffect(() => { requestKey.current = createIdempotencyKey("booking"); }, [riderId, wheelchairRequired, escortRequired, tripType, serviceType]);

  function submit() {
    const validationError = validateForm(form);
    if (validationError) {
      Alert.alert('Missing Information', validationError);
      return;
    }
    if (guardian && !riderId) { Alert.alert('Choose a rider', 'Select the rider for this booking.'); return; }
    if (tripType === 'ROUND_TRIP' && (!form.returnPickupAt || !form.returnDropoffAt || form.returnPickupAt <= form.scheduledPickupAt || form.returnDropoffAt < form.returnPickupAt)) {
      Alert.alert('Return times required', 'Choose a return pickup after the outbound pickup and a return drop-off after that.'); return;
    }
    Alert.alert('Review request', `${form.pickupAddressLine1} → ${form.dropoffAddressLine1}\nPickup: ${form.scheduledPickupAt.replace('T', ' ')}${tripType === 'ROUND_TRIP' ? `\nReturn: ${form.returnPickupAt.replace('T', ' ')}` : ''}`, [
      { text: 'Edit', style: 'cancel' }, { text: 'Request ride', onPress: () => createRide() },
    ]);
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
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

      {guardian ? <AppCard><SectionHeader title="Rider" />
        {ridersError ? <AppButton label="Retry loading riders" onPress={() => void retryRiders()} /> : null}
        {riders?.length === 0 ? <Text style={styles.note}>No riders are linked to your account. Contact your transport provider before requesting a ride.</Text> : null}
        {(riders ?? []).map(rider => <OptionPill key={rider.id} label={rider.riderDisplayName} active={riderId === rider.id} onPress={() => { setRiderId(rider.id); setWheelchairRequired(!!rider.wheelchairRequired); setEscortRequired(!!rider.escortRequired); }} />)}
      </AppCard> : null}
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
        {(locations ?? []).filter(location => !form.pickupAddressLine1 || location.addressLine1.toLowerCase().includes(form.pickupAddressLine1.toLowerCase())).slice(0, 3).map(location =>
          <AppButton key={JSON.stringify(location)} variant="ghost" label={`Use ${location.addressLine1}, ${location.city}`} onPress={() => useLocation('pickup', location)} />)}
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
        {(locations ?? []).filter(location => !form.dropoffAddressLine1 || location.addressLine1.toLowerCase().includes(form.dropoffAddressLine1.toLowerCase())).slice(0, 3).map(location =>
          <AppButton key={JSON.stringify(location)} variant="ghost" label={`Use ${location.addressLine1}, ${location.city}`} onPress={() => useLocation('dropoff', location)} />)}
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
        <SectionHeader title="Trip time and assistance" subtitle={`Company timezone: ${capabilities?.operationalSettings.timezone ?? "loading…"}`} />
        <View style={styles.fields}>
          <DateTimeField timezone={capabilities?.operationalSettings.timezone} label="Pickup" value={form.scheduledPickupAt} onChange={v => update('scheduledPickupAt', v)} />
          {tripType === 'ROUND_TRIP' ? <><DateTimeField timezone={capabilities?.operationalSettings.timezone} label="Return pickup" value={form.returnPickupAt} onChange={v => update('returnPickupAt', v)} /><DateTimeField timezone={capabilities?.operationalSettings.timezone} label="Return drop-off" value={form.returnDropoffAt} onChange={v => update('returnDropoffAt', v)} /></> : null}
          <View style={styles.assistanceRow}><Text style={styles.assistanceLabel}>Wheelchair required</Text><Switch trackColor={{ false: Colors.borderStrong, true: Colors.primary }} thumbColor={Colors.white} accessibilityLabel="Wheelchair required" value={wheelchairRequired} onValueChange={setWheelchairRequired} /></View>
          <View style={styles.assistanceRow}><Text style={styles.assistanceLabel}>Escort required</Text><Switch trackColor={{ false: Colors.borderStrong, true: Colors.primary }} thumbColor={Colors.white} accessibilityLabel="Escort required" value={escortRequired} onValueChange={setEscortRequired} /></View>
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

      <AppButton label="Review ride request" fullWidth onPress={submit} loading={isPending} />
      <Text style={styles.note}>Your request is sent to dispatch for confirmation. Times follow your transport company’s local schedule.</Text>
    </ScrollView>
  );
}

function OptionPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={label}
      style={[styles.pill, active && styles.pillActive, { minHeight: 48, justifyContent: "center" }]}
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
    return 'Choose a valid pickup date and time.';
  }
  const companions = Number(form.companionCount || '0');
  if (!Number.isInteger(companions) || companions < 0 || companions > 10) {
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
    returnPickupAt: tripType === 'ROUND_TRIP' ? form.returnPickupAt : undefined,
    returnDropoffAt: tripType === 'ROUND_TRIP' ? form.returnDropoffAt : undefined,
    companionCount: Number(form.companionCount || '0'),
    specialInstructions: form.specialInstructions.trim() || undefined,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  hero: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXl,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textPrimary,
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
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    borderColor: PassengerRoleTheme.primary,
    backgroundColor: PassengerRoleTheme.primary,
  },
  pillLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
  },
  pillLabelActive: {
    color: Colors.white,
  },
  assistanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, minHeight: 52 },
  assistanceLabel: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: Colors.textPrimary },
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
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeSm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
