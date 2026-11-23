import { GuardianHomeScreen, PassengerTripHomeScreen } from './GuardianHomeScreen';

export function PassengerHomeScreen({ guardian = false }: { guardian?: boolean }) {
  return guardian ? <GuardianHomeScreen /> : <PassengerTripHomeScreen role="rider" />;
}
