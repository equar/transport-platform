import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton, AppInput } from './ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
function localValue(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}
function zonedDate(value: string, zone: string) {
  if (!value) return new Date();
  const normalized = value.length === 16 ? `${value}:00` : value;
  const target = Date.parse(`${normalized}Z`); if (!Number.isFinite(target)) return new Date();
  let candidate = new Date(target);
  for (let attempt = 0; attempt < 3; attempt++) candidate = new Date(candidate.getTime() + target - Date.parse(`${localValue(candidate, zone)}Z`));
  return candidate;
}
/** Sends the company's wall-clock schedule without converting it to UTC. */
export function DateTimeField({ label, value, onChange, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone }: { label: string; value: string; onChange: (value: string) => void; timezone?: string }) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const date = zonedDate(value, timezone);
  if (Platform.OS === 'web') return <AppInput label={label} value={value} placeholder="YYYY-MM-DDTHH:mm:ss" onChangeText={onChange} />;
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text><Text style={styles.value}>{value ? new Intl.DateTimeFormat(undefined, { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Choose a date and time'}</Text>
    <View style={styles.buttons}>
      <AppButton label="Date" accessibilityLabel={`Choose ${label.toLowerCase()} date`} leftIcon="calendar-outline" variant="outlined" style={styles.button} onPress={() => setMode('date')} />
      <AppButton label="Time" accessibilityLabel={`Choose ${label.toLowerCase()} time`} leftIcon="clock-outline" variant="outlined" style={styles.button} onPress={() => setMode('time')} />
    </View>
    {mode ? <DateTimePicker timeZoneName={timezone} value={date} mode={mode} onChange={(event, selected) => {
      if (event.type === 'set' && selected) onChange(localValue(selected, timezone));
      if (Platform.OS === 'android') setMode(null);
    }} /> : null}
    {mode && Platform.OS === 'ios' ? <AppButton label="Done" onPress={() => setMode(null)} /> : null}
  </View>;
}
const styles = StyleSheet.create({ field: { gap: Spacing.sm }, label: { fontFamily: Typography.fontBodyMedium, color: Colors.textSecondary, fontSize: Typography.sizeSm }, value: { fontFamily: Typography.fontBody, color: Colors.textPrimary, fontSize: Typography.sizeMd, lineHeight: 23 }, buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, button: { flex: 1, minWidth: 110 } });
