import { Stack, type StackProps } from "@mui/material";
import type { PropsWithChildren } from "react";
import { PageCard } from "./PageCard";

type AdminFilterBarProps = PropsWithChildren<{
  stackProps?: StackProps;
}>;

export function AdminFilterBar({ children, stackProps }: AdminFilterBarProps) {
  return (
    <PageCard>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
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
