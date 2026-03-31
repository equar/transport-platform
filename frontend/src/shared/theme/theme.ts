import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f4c5c',
      dark: '#0b3540',
      light: '#387080',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c46a22',
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
