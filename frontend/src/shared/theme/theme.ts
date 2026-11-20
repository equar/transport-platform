import { alpha, createTheme, darken, getContrastRatio, lighten } from '@mui/material/styles';

type Branding = { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null };
const DEFAULT_PRIMARY = '#214e82';
const DEFAULT_SECONDARY = '#12263e';
const DEFAULT_ACCENT = '#00796b';

function readableColor(color: string, background: string, darkMode: boolean) {
  let candidate = color;
  for (let attempt = 0; attempt < 12 && getContrastRatio(candidate, background) < 4.5; attempt += 1) {
    candidate = darkMode ? lighten(candidate, .1) : darken(candidate, .1);
  }
  return candidate;
}

function contrastText(color: string) {
  return getContrastRatio(color, '#000') >= getContrastRatio(color, '#fff') ? '#000' : '#fff';
}

function sanitizeColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function normalizeBranding(branding?: Branding | null) {
  if (!branding) return null;
  return {
    primaryColor: sanitizeColor(branding.primaryColor, DEFAULT_PRIMARY),
    secondaryColor: sanitizeColor(branding.secondaryColor, DEFAULT_SECONDARY),
    accentColor: sanitizeColor(branding.accentColor, DEFAULT_ACCENT),
  };
}

export function createAppTheme(
  branding?: Branding | null,
  experience: 'public' | 'admin' = 'admin',
  mode: 'light' | 'dark' = 'light',
) {
  const publicSite = experience === 'public';
  const darkMode = mode === 'dark' && !publicSite;
  const resolved = publicSite ? null : normalizeBranding(branding);
  const rawPrimary = publicSite ? '#00796b' : resolved?.primaryColor || DEFAULT_PRIMARY;
  const rawSecondary = publicSite ? '#12263e' : resolved?.secondaryColor || DEFAULT_SECONDARY;
  const rawAccent = publicSite ? DEFAULT_ACCENT : resolved?.accentColor || DEFAULT_ACCENT;
  const backgroundDefault = darkMode ? '#111a23' : publicSite ? '#faf9f6' : lighten(rawPrimary, .96);
  const backgroundPaper = darkMode ? '#1b2733' : '#fff';
  const primary = readableColor(rawPrimary, backgroundPaper, darkMode);
  const secondary = readableColor(rawSecondary, backgroundPaper, darkMode);
  const accent = readableColor(rawAccent, backgroundPaper, darkMode);
  const textPrimary = darkMode ? '#edf3f8' : '#172b40';
  const textSecondary = darkMode ? '#b1bfcc' : '#626f80';
  const divider = darkMode ? '#354452' : '#e4e8ed';
  const subtleBackground = darkMode ? '#202e3a' : '#f8fafc';
  const hoverBackground = darkMode ? '#243340' : '#fafbfd';
  const controlBorder = darkMode ? '#506171' : '#d8dfe7';
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: primary, dark: darkMode ? primary : darken(primary, .22), light: darkMode ? darken(primary, .72) : lighten(primary, .85), contrastText: contrastText(primary) },
      secondary: { main: secondary, dark: rawSecondary, light: lighten(rawSecondary, .90), contrastText: contrastText(secondary) },
      background: { default: backgroundDefault, paper: backgroundPaper },
      text: { primary: textPrimary, secondary: textSecondary },
      divider,
      success: { main: darkMode ? '#7fdbb7' : '#116149', contrastText: darkMode ? '#111a23' : '#fff' },
      warning: { main: darkMode ? '#ffd180' : '#755200', contrastText: darkMode ? '#111a23' : '#fff' },
      error: { main: darkMode ? '#ffb4ab' : '#b42318', contrastText: darkMode ? '#111a23' : '#fff' },
      info: { main: darkMode ? '#90caf9' : '#004787', contrastText: darkMode ? '#111a23' : '#fff' },
    },
    spacing: 8,
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14,
      h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 700, letterSpacing: '-.055em', lineHeight: 1.06, fontSize: publicSite ? '4.5rem' : '2.3rem' },
      h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1.15, fontSize: publicSite ? '2.8rem' : '1.85rem' },
      h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 700, letterSpacing: '-.035em', lineHeight: 1.2, fontSize: publicSite ? '2.2rem' : '1.8rem' },
      h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 700, letterSpacing: '-.025em', fontSize: '1.55rem', lineHeight: 1.3 },
      h5: { fontWeight: 650, fontSize: '1.14rem', lineHeight: 1.4, letterSpacing: '-.015em' },
      h6: { fontWeight: 650, fontSize: '1rem', lineHeight: 1.5 },
      body1: { fontSize: publicSite ? '1rem' : '.9rem', lineHeight: 1.75 },
      body2: { fontSize: '.825rem', lineHeight: 1.65 },
      subtitle1: { fontSize: '.95rem', fontWeight: 600 }, subtitle2: { fontSize: '.825rem', fontWeight: 600 },
      caption: { fontSize: '.73rem', lineHeight: 1.5 },
      overline: { fontSize: '.68rem', fontWeight: 700, letterSpacing: '.14em', lineHeight: 1.8 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-.01em' },
    },
    components: {
      MuiCssBaseline: { styleOverrides: {
        body: { backgroundImage: 'none', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        '*': { boxSizing: 'border-box', scrollbarWidth: 'thin', scrollbarColor: '#bdc6d1 transparent' },
        '::selection': { background: alpha(accent, .20), color: textPrimary },
        'a:focus-visible, button:focus-visible': { outline: `3px solid ${accent}`, outlineOffset: 4 },
        '@media (prefers-reduced-motion: reduce)': { '*': { animation: 'none !important', transition: 'none !important', scrollBehavior: 'auto !important' } },
      } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
        root: { borderRadius: publicSite ? 8 : 7, minHeight: publicSite ? 42 : 36, padding: publicSite ? '9px 18px' : '7px 12px', '@media (pointer: coarse)': { minHeight: 44 }, boxShadow: 'none', transition: 'background-color .2s, border-color .2s, transform .2s' },
        sizeLarge: { minHeight: 50, padding: '12px 24px' }, outlined: { borderColor: divider },
      } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiTextField: { defaultProps: { fullWidth: true, size: publicSite ? 'medium' : 'small' } },
      MuiOutlinedInput: { styleOverrides: {
        root: { borderRadius: 8, backgroundColor: backgroundPaper, fontSize: '.9rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: controlBorder }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? '#90a5b8' : '#9aaabc' } },
        input: { padding: '14px 14px', '&.MuiInputBase-inputSizeSmall': { padding: publicSite ? '10px 14px' : '10px 12px' } },
      } },
      MuiInputLabel: { styleOverrides: { root: { fontSize: '.9rem' } } },
      MuiFormHelperText: { styleOverrides: { root: { marginLeft: 0, marginTop: 6 } } },
      MuiToolbar: { styleOverrides: { root: { minHeight: '72px !important' } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 6, height: 26, fontSize: '.72rem', fontWeight: 600 } } },
      MuiTableCell: { styleOverrides: {
        root: { padding: publicSite ? '14px 20px' : '10px 16px', borderColor: divider, fontSize: '.825rem' },
        head: { background: subtleBackground, color: textSecondary, fontSize: '.67rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' },
      } },
      MuiTablePagination: { styleOverrides: { toolbar: { flexWrap: 'wrap', justifyContent: 'flex-end', paddingLeft: 16 }, spacer: { display: 'none' }, actions: { marginLeft: 8 } } },
      MuiTableRow: { styleOverrides: { root: { '&:last-child td': { borderBottom: 0 }, '&:hover': { backgroundColor: hoverBackground } } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 14, boxShadow: darkMode ? '0 24px 90px #00000066' : '0 24px 90px #13263e26' } } },
      MuiDialogTitle: { styleOverrides: { root: { padding: '22px 24px', fontSize: '1.1rem', borderBottom: `1px solid ${divider}` } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px', borderTop: `1px solid ${divider}` } } },
      MuiMenu: { styleOverrides: { paper: { border: `1px solid ${divider}`, boxShadow: darkMode ? '0 12px 40px #00000040' : '0 12px 40px #172b4014', borderRadius: 10, marginTop: 8 } } },
      MuiMenuItem: { styleOverrides: { root: { fontSize: '.85rem', minHeight: 42 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    },
  });
}
export const appTheme = createAppTheme();
