import { Suspense } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AuthMarketingPanel } from '../../features/auth/components/AuthMarketingPanel';
import { BrandMark } from '../../shared/components/BrandMark';
import { LoadingState } from '../../shared/components/LoadingState';
export function AuthLayout() {
  return <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(400px, .9fr) minmax(520px, 1.1fr)' }, bgcolor: '#fff' }}>
    <Box sx={{ display: { xs: 'none', lg: 'flex' }, bgcolor: '#12263e', position: 'relative', overflow: 'hidden', p: { lg: 6, xl: 8 }, minHeight: '100vh' }}><AuthMarketingPanel /></Box>
    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', p: { xs: 3, sm: 6 } }}>
      <Box sx={{ display: { lg: 'none' }, mb: 6 }}><BrandMark /></Box>
      <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto', my: 'auto', py: { xs: 2, md: 5 }, '& > .MuiPaper-root': { border: 0, boxShadow: 'none', px: 0, py: 0, borderRadius: 0, background: 'transparent' } }}><Suspense fallback={<LoadingState title="Preparing your workspace" minHeight={320} />}><Outlet /></Suspense></Box>
      <Box sx={{ textAlign: 'center', color: '#98a2b0', fontSize: '.68rem', pt: 5 }}>© {new Date().getFullYear()} Bakaroo Transports · Workspace access</Box>
    </Box>
  </Box>;
}
