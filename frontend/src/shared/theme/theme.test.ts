import { getContrastRatio } from '@mui/material/styles';
import { expect, it } from 'vitest';
import { createAppTheme } from './theme';
it('uses the tenant palette for primary, secondary and derived surfaces', () => {
  const theme = createAppTheme({ primaryColor: '#276442', secondaryColor: '#173c2b', accentColor: '#8b641c' });
  expect(theme.palette.primary.main).toBe('#276442'); expect(theme.palette.secondary.main).toBe('#173c2b');
  expect(theme.palette.primary.dark).not.toBe('#153959');
});
it('keeps public-site branding independent and resets to the platform palette', () => {
  expect(createAppTheme({ primaryColor: '#276442' }, 'public').palette.primary.main).toBe('#00796b');
  expect(createAppTheme(null).palette.primary.main).toBe('#214e82');
});

it('sanitizes invalid tenant colors and resets them to the default palette', () => {
  const theme = createAppTheme({ primaryColor: 'invalid', secondaryColor: '#123456', accentColor: '#ff00ff' });
  expect(theme.palette.primary.main).toBe('#214e82');
  expect(theme.palette.secondary.main).toBe('#123456');
  expect(theme.palette.primary.light).not.toBe('#000000');
});

it('keeps text, semantic states, and branded controls readable in light and dark modes', () => {
  for (const mode of ['light', 'dark'] as const) {
    const theme = createAppTheme(undefined, 'admin', mode);
    for (const background of [theme.palette.background.default, theme.palette.background.paper]) {
      expect(getContrastRatio(theme.palette.text.primary, background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.palette.text.secondary, background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.palette.primary.main, background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.palette.secondary.main, background)).toBeGreaterThanOrEqual(4.5);
      for (const color of [theme.palette.success.main, theme.palette.warning.main,
        theme.palette.error.main, theme.palette.info.main]) {
        expect(getContrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(getContrastRatio(theme.palette.primary.main, theme.palette.primary.light)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(theme.palette.primary.dark, theme.palette.background.paper)).toBeGreaterThanOrEqual(4.5);
    for (const color of [theme.palette.primary, theme.palette.secondary, theme.palette.success,
      theme.palette.warning, theme.palette.error, theme.palette.info]) {
      expect(getContrastRatio(color.contrastText, color.main)).toBeGreaterThanOrEqual(4.5);
    }
  }
});

it('uses teal as the public brand color while retaining the admin primary', () => {
  expect(createAppTheme().palette.primary.main).toBe('#214e82');
  expect(createAppTheme(undefined, 'public').palette.primary.main).toBe('#00796b');
});

it('keeps low-contrast tenant brand colors readable against the selected theme', () => {
  for (const mode of ['light', 'dark'] as const) {
    const theme = createAppTheme({
      primaryColor: '#cde8f4',
      secondaryColor: '#eaf2f8',
      accentColor: '#d0ece8',
    }, 'admin', mode);
    for (const color of [theme.palette.primary, theme.palette.secondary]) {
      expect(getContrastRatio(color.main, theme.palette.background.paper)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(color.contrastText, color.main)).toBeGreaterThanOrEqual(4.5);
    }
  }
});
