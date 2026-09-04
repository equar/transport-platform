// Design tokens mirroring frontend/src/shared/theme/theme.ts
export const Colors = {
  primary: '#1f4d5f',
  primaryDark: '#143441',
  primaryLight: '#4f7b8a',
  primarySoft: 'rgba(31, 77, 95, 0.12)',
  secondary: '#d38c3c',
  secondaryDark: '#9a6426',
  secondaryLight: '#e5b16e',
  secondarySoft: 'rgba(211, 140, 60, 0.14)',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceStrong: '#183845',
  canvas: '#f3f6f8',
  textPrimary: '#14212b',
  textSecondary: '#5f6d77',
  textInverse: '#f4f8fa',
  divider: 'rgba(20, 33, 43, 0.08)',
  border: 'rgba(31, 77, 95, 0.14)',
  borderStrong: 'rgba(20, 33, 43, 0.2)',
  overlay: 'rgba(20, 33, 43, 0.04)',
  error: '#d32f2f',
  warning: '#d97706',
  success: '#2f7a52',
  info: '#2563eb',
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
  xxxxl: 40,
} as const;

export const Density = {
  compact: {
    rowMinHeight: 40,
    contentPadding: Spacing.md,
    gap: Spacing.sm,
  },
  comfortable: {
    rowMinHeight: 48,
    contentPadding: Spacing.lg,
    gap: Spacing.md,
  },
  spacious: {
    rowMinHeight: 56,
    contentPadding: Spacing.xl,
    gap: Spacing.lg,
  },
} as const;

export const Radius = {
  none: 0,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  input: 18,
  chip: 999,
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
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#0f2230',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  card: {
    shadowColor: '#102330',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const Motion = {
  duration: {
    quick: 140,
    normal: 220,
    deliberate: 320,
  },
  pressScale: {
    subtle: 0.985,
    strong: 0.975,
  },
} as const;
