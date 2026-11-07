import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '@auth/AuthContext';
import { AppButton } from '@components/ui';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function UnsupportedMobileRolePage() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Use the web admin portal</Text>
      <Text style={styles.body}>
        Platform and company administration are available in the web application. This mobile app is for drivers, riders, and guardians.
      </Text>
      <AppButton label="Sign out" onPress={signOut} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  heading: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeXxl,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: Typography.sizeMd,
    color: Colors.textSecondary,
  },
});
