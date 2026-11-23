import { View, StyleSheet } from 'react-native';
import { useSafeSignOut } from '@hooks/useSafeSignOut';
import { SupportContact } from './SupportContact';
import { AppButton } from './ui';
import { Spacing } from '@theme/tokens';
export function AccountActions() {
  const signOut = useSafeSignOut();
  return <View style={styles.section}><SupportContact />
    <AppButton label="Sign out" leftIcon="logout" variant="outlined" onPress={signOut} />
  </View>;
}
const styles = StyleSheet.create({ section: { gap: Spacing.lg, marginTop: Spacing.sm } });
