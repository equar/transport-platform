import { Text, View } from 'react-native';
import { AppButton } from './ui';
export function RequestError({ onRetry, message = 'Unable to load this information. Please try again.' }: { onRetry: () => void; message?: string }) {
  return <View accessibilityRole="alert" style={{ padding: 24, gap: 16 }}><Text>{message}</Text><AppButton label="Retry" onPress={onRetry} /></View>;
}
