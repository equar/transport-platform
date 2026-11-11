import { Colors } from './tokens';
import type { ColorValue } from 'react-native';

export type RoleTheme = {
  primary: ColorValue;
  primaryStrong: ColorValue;
  soft: ColorValue;
  textOnPrimary: ColorValue;
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
