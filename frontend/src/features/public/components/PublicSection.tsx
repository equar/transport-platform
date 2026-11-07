import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
export function PublicSection({ eyebrow, title, description, actions, children }: PropsWithChildren<{ eyebrow?: string; title: string; description?: string; actions?: ReactNode }>) {
  return <Stack spacing={{ xs: 4, md: 5 }}><Box sx={{ maxWidth: 780 }}>{eyebrow && <Typography variant="overline" color="primary">{eyebrow}</Typography>}<Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: '2rem', md: '2.65rem' }, lineHeight: 1.2 }}>{title}</Typography>{description && <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 670, fontSize: '1rem' }}>{description}</Typography>}{actions && <Box mt={3}>{actions}</Box>}</Box><Box>{children}</Box></Stack>;
}
