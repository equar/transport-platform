import { Redirect } from 'expo-router';

// Trips are assigned by the tenant; old request links return to assigned trips.
export default function Schedule() { return <Redirect href="/(guardian)/rides" />; }
