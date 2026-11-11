import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DriverVehicles } from '@components/DriverVehicles';
import { SupportContact } from '@components/SupportContact';
import { Spacing } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';
export default function DriverVehiclePage() {
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{padding:Spacing.xl,gap:Spacing.xl,paddingBottom:Spacing.xxxl}}), []));
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><DriverVehicles/><SupportContact/></ScrollView>;
}
