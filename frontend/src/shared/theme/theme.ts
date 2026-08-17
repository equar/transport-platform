import { createTheme } from '@mui/material/styles';
import type { Shadows } from '@mui/material/styles';

type BrandingThemeOptions = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

export function createAppTheme(branding?: BrandingThemeOptions | null) {
  const primaryMain = '#254c63';
  const secondaryMain = branding?.secondaryColor || '#cc7a34';
  const accentMain = '#5d7f95';

  const base = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: primaryMain,
        dark: '#183545',
        light: accentMain,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryMain,
        dark: '#965520',
        light: '#e0a067',
        contrastText: '#ffffff',
      },
      background: {
        default: '#edf2f6',
        paper: '#ffffff',
      },
      text: {
        primary: '#16232c',
        secondary: '#5f6e77',
      },
      divider: '#d3dce2',
    },
    spacing: 5,
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
      fontSize: 14,
      h1: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.03em' },
      h2: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.026em' },
      h3: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.022em' },
      h4: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, fontSize: '1.8rem', lineHeight: 1.08, letterSpacing: '-0.02em' },
      h5: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.15 },
      h6: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, fontSize: '1rem' },
      subtitle1: { fontWeight: 700, fontSize: '0.98rem' },
      subtitle2: { fontWeight: 700, fontSize: '0.88rem' },
      body1: { fontSize: '0.98rem', lineHeight: 1.55 },
      body2: { fontSize: '0.9rem', lineHeight: 1.5 },
      caption: { fontSize: '0.78rem', lineHeight: 1.45 },
      overline: { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '.12em' },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    shadows: [
      'none',
      '0 1px 2px rgba(16,30,38,.04)',
      '0 4px 10px rgba(16,30,38,.05)',
      '0 8px 20px rgba(16,30,38,.06)',
      '0 12px 24px rgba(16,30,38,.07)',
      '0 16px 32px rgba(16,30,38,.08)',
      ...Array(19).fill('0 18px 40px rgba(16,30,38,.08)'),
    ] as Shadows,
  });

  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: base.palette.background.default,
            backgroundImage: 'radial-gradient(circle at top left, rgba(93,127,149,.08), transparent 24%), linear-gradient(180deg, #f5f8fa 0%, #edf2f6 100%)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            color: base.palette.text.primary,
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: '#a9b4ba transparent',
            boxSizing: 'border-box',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'medium',
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            paddingInline: base.spacing(2.4),
            minHeight: 40,
            textTransform: 'none',
            boxShadow: 'none',
          },
          contained: {
            boxShadow: '0 8px 20px rgba(21,45,58,.12)',
            '&:hover': { boxShadow: '0 12px 26px rgba(21,45,58,.16)' },
          },
        },
      },
      MuiIconButton: {
        defaultProps: { size: 'medium' },
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: '#fcfdfe',
          },
        },
        defaultProps: {
          size: 'medium',
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: '#fcfdfe',
          },
        },
        defaultProps: {
          disableUnderline: true,
          size: 'medium',
        },
      },
      MuiTextField: {
        defaultProps: {
          fullWidth: true,
          size: 'medium',
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
            boxShadow: '0 28px 80px rgba(16,30,38,.22)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: { root: { minHeight: '64px !important' } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: '14px 16px', borderColor: '#e1e6e9', verticalAlign: 'middle' },
          head: {
            backgroundColor: '#f3f7fa',
            color: '#34444c',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 999, height: 28, fontWeight: 700 } },
      },
      MuiMenu: {
        styleOverrides: { paper: { border: '1px solid #d6dde1', boxShadow: '0 18px 36px rgba(16,30,38,.16)' } },
      },
      MuiMenuItem: {
        styleOverrides: { root: { minHeight: 40, fontSize: '.9rem' } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { borderBottom: '1px solid #e1e6e9', padding: '18px 24px' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { borderTop: '1px solid #e1e6e9', padding: '14px 24px', backgroundColor: '#f8fafb' } },
      },
      MuiTableRow: {
        styleOverrides: { root: { '&:hover': { backgroundColor: '#f7fafb' } } },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            maxWidth: 'none',
          },
        },
      },
    },
  });
}

export const appTheme = createAppTheme();
