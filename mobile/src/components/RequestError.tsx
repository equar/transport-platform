import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
import { AppButton } from './ui';
export function RequestError({ onRetry, message = 'Try again, or contact your transport provider if this information remains unavailable.' }: { onRetry: () => void; message?: string }) {
  return <View style={styles.screen}><View accessibilityRole="alert" style={styles.card}>
    <MaterialCommunityIcons name="cloud-alert-outline" color={Colors.primary} size={32} />
    <Text style={styles.title}>We couldn’t load this</Text><Text style={styles.body}>{message}</Text>
    <AppButton label="Try again" leftIcon="refresh" onPress={onRetry} />
  </View></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.background },
  card: { borderRadius: Radius.lg, backgroundColor: Colors.surface, padding: Spacing.xxl, borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg },
  title: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxl, color: Colors.textPrimary },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, lineHeight: 23, color: Colors.textSecondary },
});
