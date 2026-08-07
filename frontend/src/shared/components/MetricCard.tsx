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
    <PageCard sx={{ height: "100%", p: { xs: 2.25, md: 2.75 } }}>
      <Stack spacing={1.5} height="100%">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 2, color: "primary.main", bgcolor: "rgba(15, 76, 92, 0.08)", "& svg": { fontSize: 22 } }}>{icon}</Box>
          <Box sx={{ width: 30, height: 4, borderRadius: 99, bgcolor: "secondary.main", opacity: .7 }} />
        </Stack>
        <Typography variant="body2" color="text.secondary" fontWeight={700}>
          {label}
        </Typography>
        <Typography variant="h3" sx={{ lineHeight: 1.05 }}>{value}</Typography>
        {caption ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: "auto !important" }}>
            {caption}
          </Typography>
        ) : null}
      </Stack>
    </PageCard>
  );
}
