import { createTheme } from '@mui/material/styles';
import type { Shadows } from '@mui/material/styles';
import { borderTokens, shadowTokens, surfaceTokens } from './tokens';

type BrandingThemeOptions = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

export function createAppTheme(branding?: BrandingThemeOptions | null) {
  const primaryMain = branding?.primaryColor || '#c4470b';
  const secondaryMain = branding?.secondaryColor || '#8a2708';
  const accentMain = branding?.accentColor || '#f2942a';

  const base = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: primaryMain,
        dark: '#7a2106',
        light: accentMain,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryMain,
        dark: '#571503',
        light: '#c95a18',
        contrastText: '#ffffff',
      },
      background: {
        default: '#fff0e6',
        paper: '#ffffff',
      },
      text: {
        primary: '#35140a',
        secondary: '#76594d',
      },
      divider: '#edcfbd',
    },
    spacing: 5,
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
      fontSize: 14,
      h1: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: 0 },
      h2: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: 0 },
      h3: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: 0 },
      h4: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, fontSize: '1.8rem', lineHeight: 1.08, letterSpacing: 0 },
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
      shadowTokens.xs,
      shadowTokens.sm,
      shadowTokens.md,
      shadowTokens.lg,
      shadowTokens.xl,
      ...Array(19).fill('0 18px 40px rgba(16,30,38,.08)'),
    ] as Shadows,
  });

  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: base.palette.background.default,
            backgroundImage: `radial-gradient(circle at top left, ${surfaceTokens.overlaySoft}, transparent 24%), linear-gradient(180deg, ${surfaceTokens.canvasTop} 0%, ${surfaceTokens.canvasBottom} 100%)`,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            color: base.palette.text.primary,
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: '#ce7a43 transparent',
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
            borderRadius: 8,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'medium',
        },
        styleOverrides: {
          root: {
            borderRadius: 7,
            paddingInline: base.spacing(2.4),
            minHeight: 40,
            textTransform: 'none',
            boxShadow: 'none',
          },
          contained: {
            boxShadow: shadowTokens.button,
            '&:hover': { boxShadow: shadowTokens.buttonHover },
          },
        },
      },
      MuiIconButton: {
        defaultProps: { size: 'medium' },
        styleOverrides: { root: { borderRadius: 7 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            backgroundColor: '#fffdfa',
          },
        },
        defaultProps: {
          size: 'medium',
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            backgroundColor: '#fffdfa',
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
            borderRadius: 8,
            boxShadow: shadowTokens.dialog,
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
          root: { padding: '14px 16px', borderColor: borderTokens.table, verticalAlign: 'middle' },
          head: {
            backgroundColor: '#fff2e8',
            color: '#6d2b12',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 7, height: 28, fontWeight: 700 } },
      },
      MuiMenu: {
        styleOverrides: { paper: { border: `1px solid ${borderTokens.table}`, boxShadow: shadowTokens.menu } },
      },
      MuiMenuItem: {
        styleOverrides: { root: { minHeight: 40, fontSize: '.9rem' } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { borderBottom: `1px solid ${borderTokens.table}`, padding: '18px 24px' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { borderTop: `1px solid ${borderTokens.table}`, padding: '14px 24px', backgroundColor: '#f8fafb' } },
      },
      MuiTableRow: {
        styleOverrides: { root: { '&:hover': { backgroundColor: '#fff8f3' } } },
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
