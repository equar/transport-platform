import { Stack, Typography } from "@mui/material";
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
    <PageCard>
      <Stack spacing={1.5}>
        {icon}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h3">{value}</Typography>
        {caption ? (
          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        ) : null}
      </Stack>
    </PageCard>
  );
}
