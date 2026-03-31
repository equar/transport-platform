import { createTheme } from '@mui/material/styles';

type BrandingThemeOptions = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

export function createAppTheme(branding?: BrandingThemeOptions | null) {
  const primaryMain = branding?.primaryColor || '#0f4c5c';
  const secondaryMain = branding?.secondaryColor || '#c46a22';
  const accentMain = branding?.accentColor || '#387080';

  return createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
      dark: '#0b3540',
      light: accentMain,
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryMain,
      dark: '#8f4c18',
      light: '#da8b4c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f7f8f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#1c2a2f',
      secondary: '#516066',
    },
    divider: 'rgba(15, 76, 92, 0.12)',
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
  },
  });
}

export const appTheme = createAppTheme();
