import { View, StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { useSafeSignOut } from '@hooks/useSafeSignOut';
import { SupportContact } from './SupportContact';
import { AppButton } from './ui';
import { Spacing, Typography } from '@theme/tokens';
export function AccountActions() {
  const styles = useThemedStyles(createStyles);
  const signOut = useSafeSignOut();
  return <View style={styles.section}><SupportContact /><Text style={styles.note}>Need to update your account details? Contact your transport provider.</Text>
    <AppButton label="Sign out" leftIcon="logout" variant="outlined" onPress={signOut} />
  </View>;
}
const createStyles = (colors: BrandColors) => StyleSheet.create({ section: { gap: Spacing.lg, marginTop: Spacing.sm }, note: { fontFamily: Typography.fontBody, color: colors.textSecondary, fontSize: Typography.sizeSm, lineHeight: 21 } });
