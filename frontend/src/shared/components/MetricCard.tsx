import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { PageCard } from './PageCard';
export function MetricCard({ icon, label, value, caption }: { icon: ReactNode; label: string; value: ReactNode; caption?: string }) {
  return <PageCard sx={{ height: '100%', p: 2.5 }}><Stack spacing={2.5} height="100%"><Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between"><Typography variant="subtitle2" color="text.secondary">{label}</Typography><Box sx={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 1, bgcolor: '#f1f4f8', color: '#5f7894', '& svg': { fontSize: 19 } }}>{icon}</Box></Stack><Typography variant="h3" sx={{ fontSize: '2.1rem', fontWeight: 650, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.04em' }}>{value}</Typography>{caption && <Typography color="text.secondary" sx={{ fontSize: '.73rem', mt: 'auto !important', pt: .5 }}>{caption}</Typography>}</Stack></PageCard>;
}
