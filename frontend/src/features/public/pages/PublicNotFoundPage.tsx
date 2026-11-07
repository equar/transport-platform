import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
export function PublicNotFoundPage() {
  return <Stack spacing={3} sx={{ py: 8, maxWidth: 640, mx: 'auto' }}>
    <Typography variant="overline" color="primary">Page not found</Typography>
    <Typography variant="h2">Let’s get you back on the road.</Typography>
    <Typography color="text.secondary">This page may have moved. Explore our transportation services or contact our team for help.</Typography>
    <Stack direction="row" spacing={2}>
      <Button component={RouterLink} to="/" variant="contained">Go to home</Button>
      <Button component={RouterLink} to="/contact" variant="outlined">Contact us</Button>
    </Stack>
  </Stack>;
}
