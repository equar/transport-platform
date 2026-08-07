// Design tokens mirroring frontend/src/shared/theme/theme.ts
export const Colors = {
  primary: '#0f4c5c',
  primaryDark: '#0b3540',
  primaryLight: '#387080',
  secondary: '#c46a22',
  secondaryDark: '#8f4c18',
  secondaryLight: '#da8b4c',
  background: '#f4f7f9',
  surface: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#55606a',
  divider: 'rgba(15, 76, 92, 0.09)',
  border: 'rgba(15, 76, 92, 0.13)',
  surfaceMuted: '#f7faf9',
  primarySoft: '#e7f0f1',
  secondarySoft: '#fff1e6',
  error: '#d32f2f',
  warning: '#e65100',
  success: '#2e7d32',
  info: '#0288d1',
  white: '#ffffff',
  black: '#000000',

  // Status badge colours
  statusActive: '#2e7d32',
  statusInactive: '#616161',
  statusPending: '#e65100',
  statusSuspended: '#c62828',
  statusCompleted: '#1565c0',
  statusCancelled: '#757575',
  statusEnRoute: '#6a1b9a',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 18,
  input: 12,
  chip: 9999,
  // keep full circle for avatars only
  full: 9999,
} as const;

export const Typography = {
  fontBody: 'SourceSans3_400Regular',
  fontBodyMedium: 'SourceSans3_600SemiBold',
  fontBodyBold: 'SourceSans3_700Bold',
  fontHeading: 'SpaceGrotesk_700Bold',
  fontHeadingMedium: 'SpaceGrotesk_500Medium',
  sizeXs: 11,
  sizeSm: 12,
  sizeMd: 14,
  sizeLg: 16,
  sizeXl: 18,
  sizeXxl: 22,
  sizeXxxl: 28,
} as const;

export const Shadow = {
  // No shadows per design system — use border for separation
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#0f2630',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;
