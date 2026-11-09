import { expect, it } from 'vitest';
import { createAppTheme } from './theme';
it('uses the tenant palette for primary, secondary and derived surfaces', () => {
  const theme = createAppTheme({ primaryColor: '#276442', secondaryColor: '#173c2b', accentColor: '#8b641c' });
  expect(theme.palette.primary.main).toBe('#276442'); expect(theme.palette.secondary.main).toBe('#173c2b');
  expect(theme.palette.primary.dark).not.toBe('#153959');
});
it('keeps public-site branding independent and resets to the platform palette', () => {
  expect(createAppTheme({ primaryColor: '#276442' }, 'public').palette.primary.main).toBe('#bc4710');
  expect(createAppTheme(null).palette.primary.main).toBe('#214e82');
});

it('sanitizes invalid tenant colors and resets them to the default palette', () => {
  const theme = createAppTheme({ primaryColor: 'invalid', secondaryColor: '#123456', accentColor: '#ff00ff' });
  expect(theme.palette.primary.main).toBe('#214e82');
  expect(theme.palette.secondary.main).toBe('#123456');
  expect(theme.palette.primary.light).not.toBe('#000000');
});
