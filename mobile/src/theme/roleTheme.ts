import { Colors } from './tokens';

export type RoleTheme = {
  primary: string;
  primaryStrong: string;
  soft: string;
  textOnPrimary: string;
};

export const DriverRoleTheme: RoleTheme = {
  primary: Colors.primary,
  primaryStrong: Colors.primaryDark,
  soft: Colors.primarySoft,
  textOnPrimary: Colors.white,
};

export const PassengerRoleTheme: RoleTheme = {
  primary: Colors.primary,
  primaryStrong: Colors.primaryDark,
  soft: Colors.primarySoft,
  textOnPrimary: Colors.white,
};

export const GuardianRoleTheme: RoleTheme = {
  primary: Colors.primary,
  primaryStrong: Colors.primaryDark,
  soft: Colors.primarySoft,
  textOnPrimary: Colors.white,
};
