import { Box, Typography } from '@mui/material';

/** Static screenshot: the marketing page never collects sign-in credentials. */
export function MobileLoginPreview() {
  return <Box component="figure" sx={{ m: 0, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
    <Box sx={{ position: 'relative', width: { xs: 252, sm: 278, lg: 302 }, maxWidth: '100%',
      p: '8px', borderRadius: '44px', bgcolor: '#10151b', border: '1px solid #58616c',
      boxShadow: '0 18px 45px rgba(11, 36, 66, .13)',
      '&::after': { content: '""', position: 'absolute', top: 18, left: '37%', width: '26%', height: 21, bgcolor: '#080b0f', borderRadius: 20 } }}>
      <Box component="img" src="/images/platform/mobile-login-640.webp"
        alt="Bakaroo mobile app login screen on an iPhone, with email, password, authenticator code, and sign-in controls."
        width={640} height={1391} loading="eager" fetchPriority="high" decoding="async"
        sx={{ display: 'block', width: '100%', height: 'auto', borderRadius: '35px' }} />
    </Box>
    <Typography component="figcaption" sx={{ color: 'text.secondary', fontSize: '.75rem', textAlign: 'center' }}>Your transport, connected.</Typography>
  </Box>;
}
