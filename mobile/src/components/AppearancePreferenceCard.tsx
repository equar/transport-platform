import React from 'react';
import { useWindowDimensions } from 'react-native';
import { AppCard } from '@components/ui';
import { HelperText, RadioButton, SegmentedButtons, Text } from 'react-native-paper';
import { Spacing } from '@theme/tokens';
import {
  useAppearancePreference,
  type AppearancePreference,
} from '@theme/ThemeProvider';

const options: Array<{ value: AppearancePreference; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
  { value: 'system', label: 'System', icon: 'theme-light-dark' },
];

export function AppearancePreferenceCard() {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.25;
  const { preference, isLoading, error, setPreference } = useAppearancePreference();

  async function handlePreferenceChange(value: string) {
    const option = options.find((item) => item.value === value);
    if (!option) return;
    try {
      await setPreference(option.value);
    } catch {
      // The provider exposes a visible error message when persistence fails.
    }
  }

  return (
    <AppCard style={{ gap: Spacing.sm }}>
      <Text variant="titleMedium">Appearance</Text>
      <Text variant="bodySmall">
        Choose light or dark, or follow your device setting with System.
      </Text>
      {stacked ? <RadioButton.Group value={preference} onValueChange={value => void handlePreferenceChange(value)}>
        {options.map(option => <RadioButton.Item key={option.value} label={option.label} value={option.value} disabled={isLoading} style={{ minHeight: 48 }} />)}
      </RadioButton.Group> : <SegmentedButtons
        value={preference}
        onValueChange={(value) => void handlePreferenceChange(value)}
        buttons={options.map((option) => ({
          ...option,
          disabled: isLoading,
        }))}
      />}
      <HelperText type={error ? 'error' : 'info'} visible>
        {error ?? 'Saved on this device.'}
      </HelperText>
    </AppCard>
  );
}
