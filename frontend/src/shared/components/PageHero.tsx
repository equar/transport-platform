import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
export function PageHero({ eyebrow, title, description, children, visual }: PropsWithChildren<{ eyebrow: string; title: string; description: string; visual?: ReactNode }>) {
  return <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems={{ lg: 'center' }} justifyContent="space-between" sx={{ pt: 1, pb: 2.5 }}>
    <Box sx={{ minWidth: 0, maxWidth: 850 }}><Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '.62rem' }}>{eyebrow}</Typography><Typography component="h1" variant="h3" sx={{ mt: .75, fontSize: { xs: '1.55rem', md: '1.9rem' } }}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 1, fontSize: '.85rem', maxWidth: 740 }}>{description}</Typography></Box>
    {(children || visual) && <Stack spacing={2} sx={{ flexShrink: 0 }}>{visual}<Stack direction="row" useFlexGap flexWrap="wrap" spacing={1.25}>{children}</Stack></Stack>}
  </Stack>;
}
