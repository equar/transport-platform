import { Box, Container, Link, Stack, Typography } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { BrandMark } from '../../../shared/components/BrandMark';
import { publicFooterSections } from '../content/siteContent';
export function PublicFooter() {
  return <Box component="footer" sx={{ bgcolor: '#11263c', color: '#fff', pt: { xs: 7, md: 9 }, pb: 3 }}>
    <Container maxWidth={false} sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 3, md: 4 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '2fr repeat(4, 1fr)' }, gap: { xs: 4, md: 5 }, pb: 7 }}>
        <Stack spacing={2.5} sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, pr: 3 }}><BrandMark inverse /><Typography variant="body2" sx={{ color: '#aab8c8', maxWidth: 280 }}>Moving people. Connecting places. Bringing clarity to every part of your transportation operation.</Typography><Link href="/contact" underline="none" sx={{ color: '#f3b08b', fontSize: '.85rem', display: 'inline-flex', gap: 1, alignItems: 'center' }}>Let’s talk <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} /></Link></Stack>
        {publicFooterSections.map(section => <Stack key={section.title} spacing={1.5}><Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>{section.title}</Typography>{section.links.filter(link => link.to && !link.to.includes('admin.') && !link.to.includes('/login')).map(link => <Link key={link.label} href={link.to} underline="hover" sx={{ color: '#aab8c8', fontSize: '.8rem', '&:hover': { color: '#fff' } }}>{link.label}</Link>)}</Stack>)}
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ borderTop: '1px solid #ffffff18', pt: 3, color: '#8e9fb2' }}><Typography variant="caption">© {new Date().getFullYear()} Bakaroo Transports. All rights reserved.</Typography><Typography variant="caption">Thoughtfully built for the journey ahead.</Typography></Stack>
    </Container>
  </Box>;
}
