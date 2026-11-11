import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from 'react-native';

// Bakaroo mobile identity: deep navy, warm orange and soft blue surfaces.
export const LightColors = {
  primary: '#004787',
  primaryDark: '#002d50',
  primaryLight: '#447cb5',
  primarySoft: '#e7f2ff',
  onPrimaryMuted: '#c6dcfb',
  onPrimaryOverlay: 'rgba(255,255,255,0.12)',
  onPrimaryBorder: 'rgba(255,255,255,0.32)',
  onPrimarySubtle: 'rgba(255,255,255,0.68)',
  secondary: '#002d50',
  secondaryDark: '#002542',
  secondaryLight: '#447cb5',
  secondarySoft: '#e7f2ff',
  background: '#f3f6fc',
  surface: '#ffffff',
  surfaceMuted: '#f8faff',
  surfaceStrong: '#002d50',
  accent: '#ff6b00',
  successSoft: '#e8f3ee',
  warningSoft: '#fbf2df',
  errorSoft: '#fceceb',
  canvas: '#e9eef3',
  textPrimary: '#081638',
  textSecondary: '#586782',
  textInverse: '#ffffff',
  divider: '#dce3f0',
  border: '#dce3f0',
  borderStrong: '#b6c2d6',
  overlay: '#e7f2ff',
  error: '#b42318',
  warning: '#9e6612',
  success: '#197357',
  info: '#004787',
  white: '#ffffff',
  black: '#000000',

  // Status badge colours
  statusActive: '#197357',
  statusInactive: '#616161',
  statusPending: '#9e6612',
  statusSuspended: '#b42318',
  statusCompleted: '#002d50',
  statusCancelled: '#757575',
  statusEnRoute: '#004787',
} as const;

type BasePalette = { [Token in keyof typeof LightColors]: string };

export const DarkColors: BasePalette = {
  primary: '#7bbcff',
  primaryDark: '#add6ff',
  primaryLight: '#4f91cc',
  primarySoft: '#183b5e',
  onPrimaryMuted: '#d8eaff',
  onPrimaryOverlay: 'rgba(255,255,255,0.16)',
  onPrimaryBorder: 'rgba(255,255,255,0.38)',
  onPrimarySubtle: 'rgba(255,255,255,0.76)',
  secondary: '#a9d2fa',
  secondaryDark: '#071a2d',
  secondaryLight: '#4f91cc',
  secondarySoft: '#183b5e',
  background: '#0b1423',
  surface: '#111d2e',
  surfaceMuted: '#17263a',
  surfaceStrong: '#071a2d',
  accent: '#ff9a4d',
  successSoft: '#123d32',
  warningSoft: '#493719',
  errorSoft: '#4b2429',
  canvas: '#1d2b40',
  textPrimary: '#f4f7fc',
  textSecondary: '#bdc9dc',
  textInverse: '#ffffff',
  divider: '#30425b',
  border: '#30425b',
  borderStrong: '#526782',
  overlay: '#183b5e',
  error: '#ffb4ab',
  warning: '#ffd180',
  success: '#7fdbb7',
  info: '#7bbcff',
  white: '#ffffff',
  black: '#000000',
  statusActive: '#7fdbb7',
  statusInactive: '#c4cad4',
  statusPending: '#ffd180',
  statusSuspended: '#ffb4ab',
  statusCompleted: '#a9d2fa',
  statusCancelled: '#c4cad4',
  statusEnRoute: '#7bbcff',
};

type ColorToken = keyof typeof LightColors;
type DynamicColors = Record<ColorToken, ColorValue>;

function platformColor(token: ColorToken): ColorValue {
  const light = LightColors[token];
  const dark = DarkColors[token];

  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light, dark });
  }

  if (Platform.OS === 'android') {
    const resourceToken = token.replace(/[A-Z]/g, character => `_${character.toLowerCase()}`);
    return PlatformColor(`@color/mobile_${resourceToken}`);
  }

  return light;
}

// Native dynamic colors keep StyleSheet-based components synchronized with device appearance.
export const Colors: DynamicColors = Object.fromEntries(
  (Object.keys(LightColors) as ColorToken[]).map(token => [token, platformColor(token)]),
) as DynamicColors;

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
  lg: 16,
  xl: 20,
  input: 10,
  chip: 8,
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
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#1d3964',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
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
