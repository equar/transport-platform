import { Colors } from './tokens';
export type BrandColors = { [Key in keyof typeof Colors]: string };
export interface BrandingPalette { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null }

function valid(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function tint(hex: string, amount: number, target = 255) {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  return '#' + [1, 3, 5].map(start => Math.round(parseInt(normalized.slice(start, start + 2), 16) * (1 - amount) + target * amount).toString(16).padStart(2, '0')).join('');
}

export function brandingColors(branding?: BrandingPalette | null): BrandColors {
  const primary = valid(branding?.primaryColor, Colors.primary);
  const secondary = valid(branding?.secondaryColor, Colors.secondaryDark);
  const accent = valid(branding?.accentColor, Colors.accent);

  return {
    ...Colors,
    primary,
    primaryDark: tint(primary, .22, 0),
    primaryLight: tint(primary, .35),
    primarySoft: tint(primary, .90),
    secondary,
    secondaryDark: secondary,
    secondaryLight: tint(secondary, .35),
    secondarySoft: tint(secondary, .90),
    surfaceStrong: secondary,
    accent,
  };
}
