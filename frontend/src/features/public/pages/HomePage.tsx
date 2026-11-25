import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Link as RouterLink } from 'react-router-dom';
import { MobileLoginPreview } from '../components/MobileLoginPreview';
import { PlatformImage } from '../components/PlatformImage';
import { PublicCtaBand } from '../components/PublicCtaBand';
const capabilities = [
  { icon: <RouteRoundedIcon />, number: '01', title: 'A plan for every journey.', text: 'Connect bookings, recurring schedules, routes and driver assignments. Give dispatch a clear picture of what happens next.', link: 'Scheduling & dispatch' },
  { icon: <PeopleOutlineRoundedIcon />, number: '02', title: 'Everyone on the same page.', text: 'Give drivers, riders, guardians and organizations focused access to the information they need, when they need it.', link: 'Connected experiences' },
  { icon: <VerifiedUserOutlinedIcon />, number: '03', title: 'Confidence in the details.', text: 'Keep driver documents, vehicle readiness and company responsibilities visible alongside day-to-day operations.', link: 'Fleet & compliance' },
  { icon: <ReceiptLongRoundedIcon />, number: '04', title: 'Close the loop on service.', text: 'Bring invoices, payments and operational reporting together, so completed journeys lead to a clearer business picture.', link: 'Billing & insights' },
];
export function HomePage() {
  return <Stack spacing={{ xs: 8, md: 12 }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.25fr) minmax(0, .75fr)' }, gap: { xs: 3, md: 5 }, alignItems: 'center', pt: { md: 2 }, pb: { md: 3 } }}>
      <Box><Stack direction="row" spacing={1} alignItems="center" mb={3}><Box sx={{ width: 24, height: 2, bgcolor: 'primary.main' }}/><Typography variant="overline" color="primary">A better way to move people</Typography></Stack>
        <Typography variant="h1" sx={{ fontSize: { xs: '2.85rem', sm: '3.8rem', lg: '4.55rem' }, maxWidth: 600 }}>Every journey.<br/>One clear way <Box component="span" sx={{ color: 'primary.main' }}>forward.</Box></Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 680, mt: 3, mb: 4, fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.8 }}>From the first booking to the final stop. Bring your people, fleet and operations together with transportation software that keeps everyone moving.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><Button component={RouterLink} to="/contact#request-demo" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>Let’s talk about your operation</Button><Button component={RouterLink} to="/features" size="large" color="secondary">Explore the platform <ArrowOutwardRoundedIcon sx={{ fontSize: 17, ml: 1 }}/></Button></Stack>
        <Stack direction="row" spacing={2.5} sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1 }}>{['Connected workflows', 'Role-based access'].map(label => <Stack key={label} direction="row" spacing={.75} alignItems="center"><CheckRoundedIcon sx={{ color: '#6d806d', fontSize: 16 }}/><Typography sx={{ fontSize: '.72rem', color: '#6c786e' }}>{label}</Typography></Stack>)}</Stack>
      </Box><MobileLoginPreview />
    </Box>
    <PlatformImage name="operations" />
    <Box sx={{ borderTop: '1px solid #e3e5df', borderBottom: '1px solid #e3e5df', py: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr repeat(3, 1fr)' }, gap: 3, alignItems: 'center' }}><Typography sx={{ fontSize: '.78rem', color: 'text.secondary', maxWidth: 210 }}>Designed around the people<br/>you serve, every day.</Typography>{['Passenger transport', 'Care & community programs', 'Fleet & service operators'].map((label,i) => <Stack key={label} direction="row" spacing={1.5} alignItems="center"><Typography sx={{ color: '#b4bcb6', fontSize: '.7rem' }}>0{i+1}</Typography><Typography sx={{ fontFamily: 'Manrope', fontSize: '.9rem', fontWeight: 600 }}>{label}</Typography></Stack>)}</Box>
    <Box><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-end' }} spacing={3} mb={5}><Box sx={{ maxWidth: 620 }}><Typography variant="overline" color="primary">One connected operation</Typography><Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: '2rem', md: '2.7rem' } }}>Less time connecting the dots.<br/>More time moving forward.</Typography></Box><Typography color="text.secondary" sx={{ maxWidth: 340, fontSize: '.92rem' }}>Your work doesn’t happen in silos. Your software shouldn’t either.</Typography></Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, border: '1px solid #e1e5e3', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>{capabilities.map((item,i) => <Box key={item.title} sx={{ p: { xs: 3, md: 4.5 }, borderBottom: i < 2 ? '1px solid #e8ece8' : { xs: '1px solid #e8ece8', md: 0 }, borderRight: i % 2 === 0 ? { md: '1px solid #e8ece8' } : 0 }}><Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}><Box sx={{ color: '#00695c', bgcolor: '#e0f2f1', width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 1.5 }}>{item.icon}</Box><Typography sx={{ color: '#68756f', fontFamily: 'Manrope', fontSize: '.85rem' }}>{item.number}</Typography></Stack><Typography variant="h5" sx={{ fontSize: '1.35rem', mb: 1.5 }}>{item.title}</Typography><Typography color="text.secondary" sx={{ maxWidth: 430, fontSize: '.9rem', mb: 2.5 }}>{item.text}</Typography><Button component={RouterLink} to="/features" color="secondary" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />} sx={{ p: 0, fontSize: '.78rem' }}>{item.link}</Button></Box>)}</Box>
    </Box>
    <Box sx={{ bgcolor: '#0b2442', color: '#fff', borderRadius: 3, p: { xs: 3, md: 5 } }}>
      <Typography variant="overline" sx={{ color: '#ffab64' }}>Connected on every screen</Typography>
      <Typography variant="h2" sx={{ mt: 1.5, mb: 2, maxWidth: 750, fontSize: { xs: '2rem', md: '2.7rem' } }}>From the dispatch desk to the next stop.</Typography>
      <Typography sx={{ color: '#d1ddeb', maxWidth: 680, mb: 4 }}>Plan the day in the office. Keep drivers informed in the field. Give riders and guardians a clear view of their trips.</Typography>
      <PlatformImage name="mobile" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3, mt: 4 }}>
        {[['Dispatch & administration', 'Coordinate schedules, assignments, fleet readiness, and service updates.'], ['Drivers', 'Find assigned trips, see contact details, and record pickup and drop-off milestones.'], ['Riders & guardians', 'Find upcoming and active trips, track shared locations, and contact the assigned driver.']].map(([title, text]) => <Box key={title}><Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>{title}</Typography><Typography sx={{ color: '#d1ddeb', fontSize: '.9rem' }}>{text}</Typography></Box>)}
      </Box>
      <Button component={RouterLink} to="/solutions" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 3, color: '#fff' }}>Explore solutions for your team</Button>
    </Box>
    <Box><Typography variant="overline" color="primary">A practical path forward</Typography><Typography variant="h2" sx={{ mt: 1.5, mb: 5, fontSize: { xs: '2rem', md: '2.6rem' } }}>From conversation to coordination.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>{[['Tell us how you operate', 'Walk us through your team, service model and the challenges you want to solve.'],['See the right workflows', 'Explore scheduling, dispatch, access and billing in the context of your operation.'],['Build your way forward', 'Work toward a setup that connects your team and supports the way you deliver service.']].map(([title,text],i) => <Box key={title} sx={{ borderTop: '2px solid', borderColor: i === 0 ? '#00796b' : '#dce2dc', pt: 3 }}><Typography variant="overline" sx={{ color: '#63756b' }}>STEP 0{i+1}</Typography><Typography variant="h5" sx={{ mt: 2, mb: 1.5 }}>{title}</Typography><Typography color="text.secondary" sx={{ fontSize: '.88rem' }}>{text}</Typography></Box>)}</Box></Box>
    <PublicCtaBand eyebrow="The journey starts with a conversation" title="Let’s make your next move a better one." description="Tell us what your transportation operation needs. We’ll help you see how Bakaroo fits." primaryLabel="Book a demo" primaryTo="/contact#request-demo" secondaryLabel="Explore solutions" secondaryTo="/solutions" />
  </Stack>;
}
