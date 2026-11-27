import { Box } from '@mui/material';
import { useRuntimeCapabilities } from '../../features/runtime/context/RuntimeCapabilitiesContext';

export function BrandMark({ compact = false, inverse = false, usePlatformLogo = false }: { compact?: boolean; inverse?: boolean; usePlatformLogo?: boolean }) {
  const { branding } = useRuntimeCapabilities();
  if (!usePlatformLogo && branding?.logoUrl) return <Box component="img" src={branding.logoUrl} alt={branding.displayName || 'Company logo'} sx={{ width: compact ? 150 : 210, height: compact ? 42 : 58, objectFit: 'contain', objectPosition: 'left' }} />;

  return <Box sx={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, maxWidth: '100%',
    ...(inverse ? { bgcolor: '#fff', borderRadius: '8px', px: 1, py: .5 } : {}) }}>
    <Box component="img" src="/branding/BakarooTransportLogo.png" alt="Bakaroo Transport"
      sx={{ display: 'block', width: compact ? (inverse ? 180 : 210) : 270, maxWidth: '100%', height: 'auto', objectFit: 'contain' }} />
  </Box>;
}
