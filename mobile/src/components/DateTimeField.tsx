import React, { useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton } from './ui';

function localValue(date: Date, zone: string) {
  const parts=new Intl.DateTimeFormat('en-US',{ timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).formatToParts(date);
  const get=(type:string)=>parts.find(part=>part.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}
function zonedDate(value: string, zone: string) {
  if (!value) return new Date();
  const normalized=value.length===16 ? `${value}:00` : value;
  const target=Date.parse(`${normalized}Z`); if(!Number.isFinite(target)) return new Date();
  let candidate=new Date(target);
  for(let attempt=0;attempt<3;attempt++) candidate=new Date(candidate.getTime()+target-Date.parse(`${localValue(candidate,zone)}Z`));
  return candidate;
}
/** A wall-clock schedule, deliberately without converting it to UTC. */
export function DateTimeField({ label, value, onChange, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone }: { label: string; value: string; onChange: (value: string) => void; timezone?: string }) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const date = zonedDate(value, timezone);
  if (Platform.OS === 'web') return <View style={{ gap: 8 }}><Text>{label}</Text><TextInput accessibilityLabel={label} value={value} placeholder="YYYY-MM-DDTHH:mm:ss" onChangeText={onChange} /></View>;
  return <View style={{ gap: 8 }}>
    <Text>{label}: {value ? value.replace('T', ' ') : 'Choose date and time'}</Text>
    <AppButton label={`Choose ${label.toLowerCase()} date`} variant="outlined" onPress={() => setMode('date')} />
    <AppButton label={`Choose ${label.toLowerCase()} time`} variant="outlined" onPress={() => setMode('time')} />
    {mode ? <DateTimePicker timeZoneName={timezone} value={date} mode={mode} onChange={(event, selected) => {
      if (event.type === 'set' && selected) onChange(localValue(selected, timezone));
      if (Platform.OS === 'android') setMode(null);
    }} /> : null}
    {mode && Platform.OS === 'ios' ? <AppButton label="Done" onPress={() => setMode(null)} /> : null}
  </View>;
}
