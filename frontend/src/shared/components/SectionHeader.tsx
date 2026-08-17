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
      alignItems={{ xs: "stretch", md: "flex-start" }}
      sx={{
        minHeight: 72,
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.5, md: 2 },
        border: "1px solid",
        borderColor: "rgba(37,76,99,.1)",
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,.92)",
        boxShadow: "0 1px 2px rgba(16,30,38,.03), 0 10px 24px rgba(16,30,38,.035)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography variant="overline" color="secondary.dark" sx={{ display: "block", lineHeight: 1.2 }}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h4" sx={{ mt: eyebrow ? 0.4 : 0, fontSize: { xs: "1.5rem", md: "1.8rem" }, lineHeight: 1.08 }}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: .6, maxWidth: 820 }}>
          {description}
        </Typography>
      </Box>
      {children ? (
        <Box sx={{ width: { xs: "100%", md: "auto" }, pt: { md: 0.5 } }}>{children}</Box>
      ) : null}
    </Stack>
  );
}
