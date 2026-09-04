// Operational mobile design system, based on the driver command-center reference.
export const Colors = {
  primary: '#1266d6',
  primaryDark: '#084aa8',
  primaryLight: '#4d94ee',
  primarySoft: '#e7f0ff',
  secondary: '#173d78',
  secondaryDark: '#102b59',
  secondaryLight: '#3e659e',
  secondarySoft: '#eaf0f9',
  background: '#f6f8fc',
  surface: '#ffffff',
  surfaceMuted: '#f2f6fd',
  surfaceStrong: '#0b3f7c',
  canvas: '#edf3fb',
  textPrimary: '#102347',
  textSecondary: '#5c6f8f',
  textInverse: '#ffffff',
  divider: '#dce5f1',
  border: '#dce5f1',
  borderStrong: '#aebfda',
  overlay: '#e7f0ff',
  error: '#d32f2f',
  warning: '#d97706',
  success: '#2f7a52',
  info: '#2563eb',
  white: '#ffffff',
  black: '#000000',

  // Status badge colours
  statusActive: '#168847',
  statusInactive: '#616161',
  statusPending: '#e65100',
  statusSuspended: '#c62828',
  statusCompleted: '#1565c0',
  statusCancelled: '#757575',
  statusEnRoute: '#1266d6',
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
  sm: 4,
  md: 6,
  lg: 8,
  xl: 8,
  input: 6,
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
    shadowColor: '#1d3964',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#1d3964',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
