import { Box, Stack, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
export function SectionHeader({ eyebrow, title, description, children }: PropsWithChildren<{ eyebrow?: string; title: string; description: string }>) {
  return <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={3} sx={{ py: 1, mb: 1 }}><Box sx={{ minWidth: 0 }}>{eyebrow && <Typography variant="overline" color="text.secondary">{eyebrow}</Typography>}<Typography variant="h4" sx={{ mt: .5 }}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 1, maxWidth: 780, fontSize: '.85rem' }}>{description}</Typography></Box>{children && <Box sx={{ flexShrink: 0 }}>{children}</Box>}</Stack>;
}
