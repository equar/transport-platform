import { Colors } from './tokens';

export type RoleTheme = {
  primary: string;
  primaryStrong: string;
  soft: string;
  textOnPrimary: string;
};

export const DriverRoleTheme: RoleTheme = {
  primary: '#0d4bcf',
  primaryStrong: '#0a3ca8',
  soft: 'rgba(13, 75, 207, 0.10)',
  textOnPrimary: Colors.white,
};

export const PassengerRoleTheme: RoleTheme = {
  primary: '#14944d',
  primaryStrong: '#0e773d',
  soft: 'rgba(20, 148, 77, 0.10)',
  textOnPrimary: Colors.white,
};

export const GuardianRoleTheme: RoleTheme = {
  primary: '#5b35c5',
  primaryStrong: '#4829a0',
  soft: 'rgba(91, 53, 197, 0.10)',
  textOnPrimary: Colors.white,
};
