import { Suspense, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicFooter } from '../../features/public/components/PublicFooter';
import { PublicHeader } from '../../features/public/components/PublicHeader';
import { LoadingState } from '../../shared/components/LoadingState';
function PublicContent() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return <Outlet />;
}
export function PublicLayout() {
  return <Box sx={{ minHeight: '100vh', bgcolor: '#faf9f6', display: 'flex', flexDirection: 'column' }}>
    <Box component="a" href="#main-content" sx={{ position: 'fixed', top: -80, left: 16, zIndex: 2000, bgcolor: '#fff', p: 2, '&:focus': { top: 12 } }}>Skip to content</Box>
    <PublicHeader /><Box component="main" id="main-content" sx={{ flex: 1, "& [id]": { scrollMarginTop: "110px" } }}><Container maxWidth={false} sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 5, md: 8 } }}><Suspense fallback={<LoadingState title="Loading page" minHeight={320} />}><PublicContent /></Suspense></Container></Box><PublicFooter />
  </Box>;
}
