import { useBrandingColors } from '@theme/BrandingContext';
import { Typography } from '@theme/tokens';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@auth/AuthContext';
import { useOfflineQueue } from '@stores/offlineQueueStore';
import { AppButton } from './ui';
export function OfflineSyncStatus() {
  const colors = useBrandingColors();
  const { session } = useAuth();
  const router=useRouter();
  const { queue, conflicts }=useOfflineQueue();
  if(!session?.identity.roles.includes('ROLE_DRIVER')) return null;
  const owned=queue.filter(item=>item.userId===session.identity.id && item.tenantId===session.identity.tenantId);
  const reviews=conflicts.filter(item=>item.userId===session.identity.id && item.tenantId===session.identity.tenantId);
  const rideId=owned[0]?.rideId ?? reviews[0]?.rideId;
  if(!rideId) return null;
  return <View accessibilityRole="alert" style={{ padding: 12, gap: 8, backgroundColor: colors.warningSoft }}>
    <Text style={{ fontFamily: Typography.fontBody, color: colors.warning, lineHeight: 22 }}>{owned.length} trip action(s) pending • {owned.filter(item=>item.failed).length + reviews.length} need attention. Keep this session open to sync. Signing out removes pending actions from this device.</Text>
    <AppButton label="Review trip sync" variant="outlined" onPress={()=>router.push(`/(driver)/rides/${rideId}` as never)} />
  </View>;
}
