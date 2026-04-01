import type { PropsWithChildren, ReactNode } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

interface PublicSectionProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PublicSection({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PublicSectionProps) {
  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Stack spacing={2} sx={{ maxWidth: 820 }}>
        {eyebrow ? (
          <Chip
            label={eyebrow}
            color="secondary"
            sx={{ alignSelf: "flex-start", fontWeight: 700 }}
          />
        ) : null}
        <Typography
          variant="h2"
          sx={{ fontSize: { xs: "2.1rem", md: "3rem" }, lineHeight: 1 }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.05rem" }}
          >
            {description}
          </Typography>
        ) : null}
        {actions}
      </Stack>
      <Box>{children}</Box>
    </Stack>
  );
}
