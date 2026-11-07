import { Stack, type StackProps } from "@mui/material";
import type { PropsWithChildren } from "react";
import { PageCard } from "./PageCard";

type AdminFilterBarProps = PropsWithChildren<{
  stackProps?: StackProps;
}>;

export function AdminFilterBar({ children, stackProps }: AdminFilterBarProps) {
  return (
    <PageCard sx={{ p: 2, bgcolor: "#f8fbfd", borderColor: "rgba(37,76,99,.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.74), 0 8px 22px rgba(16,30,38,.03)" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        useFlexGap
        flexWrap="wrap"
        alignItems={{ xs: "stretch", md: "flex-start" }}
        {...stackProps}
      >
        {children}
      </Stack>
    </PageCard>
  );
}
