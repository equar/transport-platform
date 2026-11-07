import { View, StyleSheet, Text } from 'react-native';
import { useSafeSignOut } from '@hooks/useSafeSignOut';
import { SupportContact } from './SupportContact';
import { AppButton } from './ui';
import { Colors, Spacing, Typography } from '@theme/tokens';
export function AccountActions() {
  const signOut = useSafeSignOut();
  return <View style={styles.section}><SupportContact /><Text style={styles.note}>Need to update your account details? Contact your transport provider.</Text>
    <AppButton label="Sign out" leftIcon="logout" variant="outlined" onPress={signOut} />
  </View>;
}
const styles = StyleSheet.create({ section: { gap: Spacing.lg, marginTop: Spacing.sm }, note: { fontFamily: Typography.fontBody, color: Colors.textSecondary, fontSize: Typography.sizeSm, lineHeight: 21 } });
