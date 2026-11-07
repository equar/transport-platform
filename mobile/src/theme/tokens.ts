// Mobile adaptation of the admin portal: Inter, Manrope, slate canvas and muted blue.
export const Colors = {
  primary: '#214e82',
  primaryDark: '#153959',
  primaryLight: '#577ca7',
  primarySoft: '#e6edf6',
  onPrimaryMuted: '#c6dcfb',
  onPrimaryOverlay: 'rgba(255,255,255,0.12)',
  onPrimaryBorder: 'rgba(255,255,255,0.32)',
  onPrimarySubtle: 'rgba(255,255,255,0.68)',
  secondary: '#153959',
  secondaryDark: '#12263e',
  secondaryLight: '#577ca7',
  secondarySoft: '#e6edf6',
  background: '#f4f6f9',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceStrong: '#14283f',
  accent: '#d8662a',
  successSoft: '#e8f3ee',
  warningSoft: '#fbf2df',
  errorSoft: '#fceceb',
  canvas: '#e9eef3',
  textPrimary: '#172b40',
  textSecondary: '#667384',
  textInverse: '#ffffff',
  divider: '#e4e8ed',
  border: '#e4e8ed',
  borderStrong: '#bdc6d1',
  overlay: '#e6edf6',
  error: '#b42318',
  warning: '#9e6612',
  success: '#197357',
  info: '#214e82',
  white: '#ffffff',
  black: '#000000',

  // Status badge colours
  statusActive: '#197357',
  statusInactive: '#616161',
  statusPending: '#9e6612',
  statusSuspended: '#b42318',
  statusCompleted: '#153959',
  statusCancelled: '#757575',
  statusEnRoute: '#214e82',
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
  md: 8,
  lg: 10,
  xl: 14,
  input: 8,
  chip: 6,
  // keep full circle for avatars only
  full: 9999,
} as const;

export const Typography = {
  fontBody: 'Inter_400Regular',
  fontBodyMedium: 'Inter_600SemiBold',
  fontBodyBold: 'Inter_700Bold',
  fontHeading: 'Manrope_700Bold',
  fontHeadingMedium: 'Manrope_500Medium',
  sizeXs: 12,
  sizeSm: 13,
  sizeMd: 15,
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
    elevation: 1,
  },
  card: {
    shadowColor: '#1d3964',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
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
