import { Box, Stack, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
export function SectionHeader({ eyebrow, title, description, children }: PropsWithChildren<{ eyebrow?: string; title: string; description: string }>) {
  return <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'flex-start' }} spacing={2} sx={{ pb: 1, minWidth: 0 }}>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      {eyebrow && <Typography variant="overline" color="text.secondary" sx={{ fontSize: '.62rem' }}>{eyebrow}</Typography>}
      <Typography variant="h4" sx={{ mt: .25 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: .5, maxWidth: 780, fontSize: '.825rem' }}>{description}</Typography>
    </Box>
    {children && <Box sx={{ minWidth: 0, maxWidth: { lg: '50%' } }}>{children}</Box>}
  </Stack>;
}
