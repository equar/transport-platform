import { useEffect, useState } from 'react';
import { AppBar, Box, Button, Container, Drawer, IconButton, Stack, Toolbar } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { BrandMark } from '../../../shared/components/BrandMark';
const navigation = [{ label: 'Solutions', to: '/solutions' }, { label: 'Platform', to: '/features' }, { label: 'Pricing', to: '/pricing' }, { label: 'About us', to: '/about' }, { label: 'Contact', to: '/contact' }];
export function PublicHeader() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  const links = navigation.map(item => <Button key={item.to} component={RouterLink} to={item.to} onClick={() => setOpen(false)} aria-current={pathname === item.to ? 'page' : undefined} color="inherit" sx={{ fontSize: '.83rem', color: pathname === item.to ? 'primary.main' : 'text.secondary', px: 1.5, justifyContent: { xs: 'flex-start', md: 'center' } }}>{item.label}</Button>);
  return <AppBar position="sticky" elevation={0} color="transparent" sx={{ bgcolor: '#faf9f6f5', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e9e8e3' }}>
    <Container maxWidth={false} sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
      <Toolbar disableGutters sx={{ gap: 3, minHeight: '84px !important' }}>
        <Box component={RouterLink} to="/" aria-label="Bakaroo Transports home" sx={{ color: 'inherit', textDecoration: 'none' }}><BrandMark compact /></Box>
        <Stack direction="row" spacing={.5} sx={{ display: { xs: 'none', md: 'flex' }, mx: 'auto' }}>{links}</Stack>
        <Button component={RouterLink} to="/contact#request-demo" variant="contained" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Book a demo</Button>
        <IconButton aria-label="Open navigation menu" onClick={() => setOpen(true)} sx={{ ml: 'auto', display: { md: 'none' } }}><MenuRoundedIcon /></IconButton>
      </Toolbar>
    </Container>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 'min(340px, 90vw)', p: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}><BrandMark compact /><IconButton aria-label="Close navigation menu" onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton></Stack>
      <Stack spacing={1}>{links}<Button component={RouterLink} to="/contact#request-demo" onClick={() => setOpen(false)} variant="contained" sx={{ mt: 3 }}>Book a demo</Button></Stack>
    </Drawer>
  </AppBar>;
}
