import { RoleShell } from '@components/RoleShell';
import { useBrandingColors } from '@theme/BrandingContext';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DriverLayout() {
  const colors = useBrandingColors();
  return (
    <RoleShell role="driver"><Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingTop: 7,
          paddingBottom: 7,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen
        name="compliance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="vehicle" options={{ href: null }} />
    </Tabs></RoleShell>
  );
}
