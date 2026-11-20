import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { PageCard } from './PageCard';
export function MetricCard({ icon, label, value, caption }: { icon: ReactNode; label: string; value: ReactNode; caption?: string }) {
  return <PageCard sx={{ height: '100%', p: 2 }}><Stack spacing={1.25}>
    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
      <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
      <Box sx={{ width: 28, height: 28, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 1, bgcolor: 'action.hover', color: 'primary.main', '& svg': { fontSize: 18 } }}>{icon}</Box>
    </Stack>
    <Typography variant="h3" sx={{ fontSize: '1.7rem', fontWeight: 650, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em' }}>{value}</Typography>
    {caption && <Typography color="text.secondary" sx={{ fontSize: '.73rem' }}>{caption}</Typography>}
  </Stack></PageCard>;
}
