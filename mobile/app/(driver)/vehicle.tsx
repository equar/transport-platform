import { ScrollView, StyleSheet } from 'react-native';
import { DriverVehicles } from '@components/DriverVehicles';
import { SupportContact } from '@components/SupportContact';
import { Colors, Spacing } from '@theme/tokens';
export default function DriverVehiclePage() {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><DriverVehicles/><SupportContact/></ScrollView>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:Colors.background},content:{padding:Spacing.xl,gap:Spacing.xl,paddingBottom:Spacing.xxxl}});
