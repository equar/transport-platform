import { Text, View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { useAuth } from '@auth/AuthContext';
import { AppButton } from '@components/ui';
import { Spacing, Typography } from '@theme/tokens';

export default function UnsupportedMobileRolePage() {
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xxl,
    backgroundColor: colors.background,
  },
  heading: {
    fontFamily: 'Manrope_700Bold',
    fontSize: Typography.sizeXxl,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.sizeMd,
    color: colors.textSecondary,
  },
});
