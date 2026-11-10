import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

// React Query's browser listeners do not receive native app/network events.
export function useQueryConnectivity() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    focusManager.setFocused(AppState.currentState === 'active');
    const appState = AppState.addEventListener('change', state => focusManager.setFocused(state === 'active'));
    const network = NetInfo.addEventListener(state => onlineManager.setOnline(state.isConnected === true && state.isInternetReachable !== false));
    return () => { appState.remove(); network(); };
  }, []);
}
