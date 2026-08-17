import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { PageCard } from "./PageCard";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  caption?: string;
}

export function MetricCard({ icon, label, value, caption }: MetricCardProps) {
  return (
    <PageCard sx={{ height: "100%", p: 2.25, position: "relative", overflow: "hidden", "&::after": { content: '\"\"', position: "absolute", inset: "0 auto auto 0", width: 84, height: 4, borderRadius: 99, bgcolor: "primary.main" } }}>
      <Stack spacing={1.2} height="100%">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 2, color: "primary.main", bgcolor: "rgba(37, 76, 99, 0.08)", "& svg": { fontSize: 22 } }}>{icon}</Box>
        </Stack>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ lineHeight: 1, fontSize: { xs: "2rem", md: "2.35rem" } }}>{value}</Typography>
        {caption ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: "auto !important", lineHeight: 1.45 }}>
            {caption}
          </Typography>
        ) : null}
      </Stack>
    </PageCard>
  );
}
