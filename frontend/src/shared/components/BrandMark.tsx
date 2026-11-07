import { Box, Stack, Typography } from '@mui/material';
import { useRuntimeCapabilities } from '../../features/runtime/context/RuntimeCapabilitiesContext';
export function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  const { branding } = useRuntimeCapabilities();
  if (branding?.logoUrl) return <Box component="img" src={branding.logoUrl} alt={branding.displayName || 'Company logo'} sx={{ width: compact ? 150 : 210, height: compact ? 42 : 58, objectFit: 'contain', objectPosition: 'left' }} />;
  return <Stack direction="row" spacing={1.2} alignItems="center" aria-label="Bakaroo Transports">
    <Box component="img" src="/branding/bakaroo-app-icon.png" alt="" sx={{ width: compact ? 37 : 44, height: compact ? 37 : 44, borderRadius: '10px', flexShrink: 0 }} />
    <Box><Typography sx={{ fontFamily: 'Manrope, sans-serif', fontSize: compact ? '1.15rem' : '1.4rem', fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1.15, color: inverse ? '#fff' : '#142b46' }}>bakaroo<Box component="span" sx={{ color: '#d8662a' }}>.</Box></Typography>
    <Typography sx={{ fontSize: '.52rem', fontWeight: 650, letterSpacing: '.22em', mt: .35, color: inverse ? '#a3b3c6' : '#69788b' }}>TRANSPORTS</Typography></Box>
  </Stack>;
}
