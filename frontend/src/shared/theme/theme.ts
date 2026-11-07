import { createTheme } from '@mui/material/styles';

type Branding = { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null };
export function createAppTheme(branding?: Branding | null, experience: 'public' | 'admin' = 'admin') {
  const publicSite = experience === 'public';
  const primary = publicSite ? '#bc4710' : branding?.primaryColor || '#214e82';
  return createTheme({
    palette: {
      primary: { main: primary, dark: publicSite ? '#92370c' : '#153959', light: publicSite ? '#f4b68c' : '#e6edf6', contrastText: '#fff' },
      secondary: { main: '#12263e', light: '#e9eef3', contrastText: '#fff' },
      background: { default: publicSite ? '#faf9f6' : '#f4f6f9', paper: '#fff' },
      text: { primary: '#172b40', secondary: '#667384' },
      divider: '#e4e8ed',
      success: { main: '#197357' }, warning: { main: '#9e6612' },
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
        '::selection': { background: '#f5d9c5', color: '#172b40' },
        'a:focus-visible, button:focus-visible': { outline: '3px solid #d06b32', outlineOffset: 4 },
        '@media (prefers-reduced-motion: reduce)': { '*': { animation: 'none !important', transition: 'none !important', scrollBehavior: 'auto !important' } },
      } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
        root: { borderRadius: publicSite ? 8 : 7, minHeight: 42, padding: '9px 18px', boxShadow: 'none', transition: 'background-color .2s, border-color .2s, transform .2s' },
        sizeLarge: { minHeight: 50, padding: '12px 24px' }, outlined: { borderColor: '#d4dbe3' },
      } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiTextField: { defaultProps: { fullWidth: true } },
      MuiOutlinedInput: { styleOverrides: {
        root: { borderRadius: 8, backgroundColor: '#fff', fontSize: '.9rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d8dfe7' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9aaabc' } },
        input: { padding: '14px 14px' },
      } },
      MuiInputLabel: { styleOverrides: { root: { fontSize: '.9rem' } } },
      MuiFormHelperText: { styleOverrides: { root: { marginLeft: 0, marginTop: 6 } } },
      MuiToolbar: { styleOverrides: { root: { minHeight: '72px !important' } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 6, height: 26, fontSize: '.72rem', fontWeight: 600 } } },
      MuiTableCell: { styleOverrides: {
        root: { padding: '14px 20px', borderColor: '#edf0f3', fontSize: '.825rem' },
        head: { background: '#f8fafc', color: '#667384', fontSize: '.67rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' },
      } },
      MuiTableRow: { styleOverrides: { root: { '&:last-child td': { borderBottom: 0 }, '&:hover': { backgroundColor: '#fafbfd' } } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 14, boxShadow: '0 24px 90px #13263e26' } } },
      MuiDialogTitle: { styleOverrides: { root: { padding: '22px 24px', fontSize: '1.1rem', borderBottom: '1px solid #edf0f3' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px', borderTop: '1px solid #edf0f3' } } },
      MuiMenu: { styleOverrides: { paper: { border: '1px solid #e4e8ed', boxShadow: '0 12px 40px #172b4014', borderRadius: 10, marginTop: 8 } } },
      MuiMenuItem: { styleOverrides: { root: { fontSize: '.85rem', minHeight: 42 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    },
  });
}
export const appTheme = createAppTheme();
