import { Tabs } from 'expo-router';
import { Colors, Typography } from '@theme/tokens';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GuardianLayout() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 66 + insets.bottom, paddingTop: 7, paddingBottom: 8 + insets.bottom,
          shadowColor: '#0f2630', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'SourceSans3_600SemiBold',
          fontSize: Typography.sizeXs,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-heart" color={color} size={size} /> }} />
      <Tabs.Screen name="riders" options={{ title: 'Riders', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="rides" options={{ title: 'Rides', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="car-clock" color={color} size={size} /> }} />
      <Tabs.Screen name="billing" options={{ title: 'Billing', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="credit-card-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Inbox', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} /> }} />
      </Tabs>
    </SafeAreaView>
  );
}
