import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

/** Compact workspace heading and command area for administrative pages. */
export function PageHero({ eyebrow, title, description, children, visual }: PropsWithChildren<{ eyebrow: string; title: string; description: string; visual?: ReactNode }>) {
  return <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'flex-start' }} justifyContent="space-between" sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontSize: '.62rem' }}>{eyebrow}</Typography>
      <Typography component="h1" variant="h4" sx={{ mt: .25 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: .5, fontSize: '.825rem', maxWidth: 740 }}>{description}</Typography>
    </Box>
    {(children || visual) && <Stack spacing={1.5} sx={{ minWidth: 0, maxWidth: { lg: '52%' } }}>{visual}<Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>{children}</Stack></Stack>}
  </Stack>;
}
