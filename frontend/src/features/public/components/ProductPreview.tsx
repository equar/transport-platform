import { Box, Stack, Typography } from '@mui/material';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
export function ProductPreview() {
  return <Box aria-label="Illustrative preview of connected dispatch and route planning" sx={{ position: 'relative', p: { xs: 1.5, md: 3 }, pb: { xs: 4, md: 5 } }}>
    <Box sx={{ position: 'absolute', inset: '8% 0 0 8%', bgcolor: '#eeeae2', borderRadius: '50% 36% 28% 40%' }} />
    <Box sx={{ position: 'relative', bgcolor: '#fff', border: '1px solid #e3e6e8', borderRadius: 2, overflow: 'hidden', boxShadow: '0 24px 70px #19324914', transform: { md: 'rotate(-1.5deg)' } }}>
      <Stack direction="row" spacing={.65} alignItems="center" sx={{ borderBottom: '1px solid #edf0f3', px: 2, py: 1.6 }}>
        {['#e2e6eb','#e2e6eb','#e2e6eb'].map((color,i) => <Box key={i} sx={{ width: 6, height: 6, bgcolor: color, borderRadius: '50%' }} />)}
        <Typography sx={{ ml: 'auto !important', fontSize: '.6rem', color: '#7b8796', letterSpacing: '.09em' }}>BAKAROO / DISPATCH</Typography>
      </Stack>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}><Box><Typography sx={{ fontWeight: 700, fontSize: '.95rem' }}>A clearer view of the day</Typography><Typography sx={{ color: 'text.secondary', fontSize: '.65rem', mt: .25 }}>People, vehicles and journeys. Connected.</Typography></Box><Box sx={{ bgcolor: '#fff2e8', color: '#a84915', borderRadius: 1, p: 1 }}><RouteRoundedIcon fontSize="small" /></Box></Stack>
        <Box sx={{ bgcolor: '#f1f4f2', borderRadius: 1.5, overflow: 'hidden', position: 'relative', border: '1px solid #e8ede8' }}>
          <svg viewBox="0 0 480 280" width="100%" role="img" aria-label="Example route connecting pickup, a community stop and destination" style={{ display: 'block' }}>
            <rect width="480" height="280" fill="#edf1ec" />
            <path d="M345 0 C300 70 380 150 330 280 L395 280 C430 170 345 90 415 0" fill="#d7e6e5" />
            <g stroke="#fff" strokeWidth="13" fill="none"><path d="M-10 70 L500 70 M-10 173 L500 173 M105 -10 L105 300 M260 -10 L260 300 M-20 275 L460 -5" /></g>
            <g fill="#e0e6dc"><rect x="28" y="90" width="55" height="58" rx="9"/><rect x="131" y="90" width="88" height="58" rx="9"/><rect x="279" y="91" width="40" height="56" rx="9"/><rect x="130" y="195" width="97" height="48" rx="9"/><rect x="30" y="12" width="53" height="35" rx="9"/><rect x="282" y="13" width="47" height="34" rx="9"/></g>
            <path d="M105 220 L105 173 L260 173 L260 70 L378 70" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M105 220 L105 173 L260 173 L260 70 L378 70" fill="none" stroke="#cf642a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="#fff" stroke="#cf642a" strokeWidth="4"><circle cx="105" cy="220" r="8"/><circle cx="260" cy="173" r="8"/><circle cx="378" cy="70" r="8"/></g>
            <g fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600" fill="#53665d"><text x="24" y="260">PICKUP</text><text x="284" y="196">COMMUNITY STOP</text><text x="351" y="47">DESTINATION</text></g>
            <g transform="translate(184 173)"><circle r="18" fill="#172e48" stroke="#fff" strokeWidth="4"/><path d="M-6 3 L0 -7 L6 3 L0 0Z" fill="#fff"/></g>
          </svg>
          <Stack direction="row" spacing={.75} alignItems="center" sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#ffffffed', border: '1px solid #e0e6e4', borderRadius: 1, px: 1.2, py: .7 }}><Box sx={{ width: 6, height: 6, bgcolor: '#358066', borderRadius: '50%' }}/><Typography sx={{ fontSize: '.6rem', fontWeight: 600 }}>Route overview</Typography></Stack>
        </Box>
        <Stack spacing={0} mt={1.5}>{[
          ['Morning pickup', 'Driver and vehicle assigned', 'Assigned'],
          ['Community connection', 'Route and stops prepared', 'Scheduled'],
        ].map(([title,desc,status],i) => <Stack key={title} direction="row" spacing={1.25} alignItems="center" sx={{ py: 1.35, borderBottom: i === 0 ? '1px solid #edf0f3' : 0 }}><Box sx={{ bgcolor: '#f1f4f8', color: '#45617c', borderRadius: 1, p: .75, display: 'grid' }}><DirectionsCarRoundedIcon sx={{ fontSize: 17 }}/></Box><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: '.7rem', fontWeight: 600 }}>{title}</Typography><Typography sx={{ fontSize: '.6rem', color: 'text.secondary' }}>{desc}</Typography></Box><Typography sx={{ fontSize: '.58rem', bgcolor: i === 0 ? '#e9f3ed' : '#edf1f8', color: i === 0 ? '#287051' : '#4e6484', px: 1, py: .4, borderRadius: .65 }}>{status}</Typography></Stack>)}</Stack>
      </Box>
    </Box>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative', ml: { xs: 1, md: 4 }, mt: -1.5, p: 1.5, bgcolor: '#fff', border: '1px solid #e6e9e6', borderRadius: 1.5, width: 'fit-content', boxShadow: '0 10px 30px #172b4010' }}><Box sx={{ bgcolor: '#fceee4', color: '#b94c14', p: 1, display: 'grid', borderRadius: 1 }}><ArrowForwardRoundedIcon fontSize="small" /></Box><Box><Typography sx={{ fontSize: '.72rem', fontWeight: 650 }}>Less coordination. More connection.</Typography><Typography sx={{ fontSize: '.6rem', color: 'text.secondary' }}>One place to bring your operation together.</Typography></Box></Stack>
    <Typography sx={{ textAlign: 'right', position: 'relative', fontSize: '.55rem', color: '#8b938e', mt: 1.5, letterSpacing: '.1em' }}>PLATFORM PREVIEW · ILLUSTRATIVE DATA</Typography>
  </Box>;
}
