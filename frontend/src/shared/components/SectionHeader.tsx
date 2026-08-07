import { Box, Stack, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";

interface SectionHeaderProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  children,
}: SectionHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "flex-end" }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography variant="overline" color="secondary.dark" sx={{ display: "inline-flex", px: 1.25, py: .4, borderRadius: 99, bgcolor: "rgba(196,106,34,.1)" }}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h3" sx={{ mt: eyebrow ? 1 : 0 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
          {description}
        </Typography>
      </Box>
      {children ? (
        <Box sx={{ width: { xs: "100%", md: "auto" } }}>{children}</Box>
      ) : null}
    </Stack>
  );
}
