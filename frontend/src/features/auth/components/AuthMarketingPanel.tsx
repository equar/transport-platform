import { Box, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { BrandMark } from '../../../shared/components/BrandMark';
export function AuthMarketingPanel() {
  return <Stack sx={{ width: '100%', position: 'relative', zIndex: 1 }} justifyContent="space-between" spacing={6}>
    <BrandMark inverse />
    <Box sx={{ maxWidth: 470 }}><Typography variant="overline" sx={{ color: '#e6a87c' }}>Your operation. In focus.</Typography><Typography variant="h2" sx={{ fontSize: { lg: '3.2rem', xl: '3.8rem' }, lineHeight: 1.1, color: '#fff', mt: 3, mb: 3 }}>Good journeys<br/>start with a<br/><Box component="span" sx={{ color: '#efae80' }}>clearer view.</Box></Typography><Typography sx={{ color: '#aebdcd', maxWidth: 370, fontSize: '.95rem', lineHeight: 1.8 }}>Your people, schedules and daily operations. Connected in one focused workspace.</Typography>
      <Stack spacing={1.75} mt={4}>{['Keep the day moving', 'Connect your team', 'Stay on top of the details'].map(label => <Stack key={label} direction="row" spacing={1.5} alignItems="center"><CheckRoundedIcon sx={{ fontSize: 17, color: '#e2a27a' }}/><Typography sx={{ fontSize: '.8rem', color: '#c5d0db' }}>{label}</Typography></Stack>)}</Stack>
    </Box>
    <Box><Box component="svg" viewBox="0 0 500 100" aria-hidden="true" sx={{ width: '100%', maxWidth: 460, height: 90, mb: 3, overflow: 'visible' }}><path d="M0 75 H100 Q125 75 125 50 V35 Q125 12 150 12 H275 Q300 12 300 35 V65 Q300 88 325 88 H500" fill="none" stroke="#ffffff13" strokeWidth="18"/><path d="M0 75 H100 Q125 75 125 50 V35 Q125 12 150 12 H275 Q300 12 300 35 V65 Q300 88 325 88 H500" fill="none" stroke="#e9a679" strokeWidth="2" strokeDasharray="5 7"/><circle cx="45" cy="75" r="7" fill="#12263e" stroke="#e9a679" strokeWidth="2"/><circle cx="220" cy="12" r="7" fill="#e9a679"/><circle cx="450" cy="88" r="7" fill="#12263e" stroke="#e9a679" strokeWidth="2"/></Box><Typography sx={{ color: '#8095ab', fontSize: '.72rem' }}>Moving people. Connecting places.</Typography></Box>
  </Stack>;
}
