import { Alert } from 'react-native';
import { useAuth } from '@auth/AuthContext';
import { useOfflineQueue } from '@stores/offlineQueueStore';
export function useSafeSignOut() {
  const { session, signOut } = useAuth();
  return () => {
    const count = useOfflineQueue.getState().queue.filter(item => item.userId === session?.identity.id && item.tenantId === session.identity.tenantId).length;
    if (!count) { void signOut(); return; }
    Alert.alert('Unsent trip updates', `You have ${count} trip update${count === 1 ? '' : 's'} waiting to sync. Signing out removes them from this device. Cancel to sync first.`, [
      { text: 'Cancel', style: 'cancel' }, { text: 'Sign out and remove', style: 'destructive', onPress: () => { void signOut(); } },
    ]);
  };
}
