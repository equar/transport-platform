import { alpha, createTheme, type Shadows } from '@mui/material/styles';

type BrandingThemeOptions = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

export function createAppTheme(branding?: BrandingThemeOptions | null) {
  const primaryMain = branding?.primaryColor || '#0f4c5c';
  const secondaryMain = branding?.secondaryColor || '#c46a22';
  const accentMain = branding?.accentColor || '#387080';
  const shadows = Array(25).fill('none') as Shadows;
  shadows[1] = '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 76, 92, 0.05)';
  shadows[2] = '0 2px 6px rgba(15, 23, 42, 0.06), 0 14px 34px rgba(15, 76, 92, 0.08)';
  shadows[3] = '0 8px 18px rgba(15, 23, 42, 0.08), 0 24px 54px rgba(15, 76, 92, 0.12)';

  const base = createTheme({
    palette: {
      mode: 'light',
      primary: { main: primaryMain, dark: '#0b3540', light: accentMain, contrastText: '#fff' },
      secondary: { main: secondaryMain, dark: '#8f4c18', light: '#da8b4c', contrastText: '#fff' },
      background: { default: '#eef3f5', paper: '#ffffff' },
      text: { primary: '#10232b', secondary: '#657982' },
      divider: alpha(primaryMain, 0.12),
      success: { main: '#16805d' },
      warning: { main: '#b76313' },
      error: { main: '#c53d4c' },
      info: { main: '#2877a7' },
    },
    spacing: 8,
    shape: { borderRadius: 16 },
    shadows,
    typography: {
      fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
      fontSize: 14,
      h1: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.035em' },
      h2: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.03em' },
      h3: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.035em', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.08 },
      h4: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
      overline: { fontWeight: 800, letterSpacing: '0.11em', fontSize: '0.7rem' },
    },
  });

  return createTheme(base, {
    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: base.palette.background.default, WebkitFontSmoothing: 'antialiased' }, '::selection': { background: alpha(primaryMain, .18) }, '*': { scrollbarWidth: 'thin', scrollbarColor: `${alpha(primaryMain,.24)} transparent` } } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { styleOverrides: { root: { border: `1px solid ${base.palette.divider}`, boxShadow: shadows[1], borderRadius: 22 } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10, minHeight: 40, paddingInline: 18 }, contained: { boxShadow: `0 7px 18px ${alpha(primaryMain, .2)}` } } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: base.palette.background.paper, transition: 'box-shadow 160ms ease', '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(primaryMain, .1)}` } } } },
      MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 20, boxShadow: shadows[3] } } },
      MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 700 }, outlined: { backgroundColor: alpha(primaryMain, .025) } } },
      MuiTableCell: { styleOverrides: { head: { backgroundColor: '#f7f9fa', color: base.palette.text.secondary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', fontSize: '.72rem' }, root: { borderColor: base.palette.divider } } },
      MuiTableRow: { styleOverrides: { root: { transition: 'background-color 140ms ease', '&:hover': { backgroundColor: alpha(primaryMain, .025) } } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8 } } },
    },
  });
}

export const appTheme = createAppTheme();
