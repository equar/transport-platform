import { Stack, type StackProps } from "@mui/material";
import type { PropsWithChildren } from "react";
import { PageCard } from "./PageCard";

type AdminFilterBarProps = PropsWithChildren<{
  stackProps?: StackProps;
}>;

export function AdminFilterBar({ children, stackProps }: AdminFilterBarProps) {
  const { sx, ...layoutProps } = stackProps ?? {};

  return (
    <PageCard sx={{ p: 2, bgcolor: "background.paper", borderColor: "divider", boxShadow: "none" }}>
      <Stack
        spacing={1.5}
        useFlexGap
        alignItems="center"
        {...layoutProps}
        sx={[
          {
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
            },
            // Full-width form defaults fill a grid cell, not the entire filter bar.
            // Override page-specific minimum widths so narrow containers never overflow.
            "& > .MuiFormControl-root, & > .MuiAutocomplete-root": {
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
            },
            "& > .MuiFormControlLabel-root": {
              minWidth: 0,
              mx: 0,
              minHeight: 48,
            },
            "& > .MuiButton-root": { minWidth: 0, minHeight: 48 },
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {children}
      </Stack>
    </PageCard>
  );
}
