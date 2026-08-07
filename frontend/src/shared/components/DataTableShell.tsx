import type { PropsWithChildren, ReactNode } from "react";
import { Box, Paper } from "@mui/material";
import { PageCard } from "./PageCard";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

export function DataTableShell({ loading, empty, emptyTitle, emptyDescription, pagination, children }: PropsWithChildren<{ loading: boolean; empty: boolean; emptyTitle: string; emptyDescription: string; pagination?: ReactNode }>) {
  return <PageCard sx={{ p: 0, overflow: "hidden" }}>
    {loading ? <LoadingState /> : empty ? <EmptyState title={emptyTitle} description={emptyDescription} /> : <><Paper sx={{ overflowX: "auto", borderRadius: 0 }}>{children}</Paper>{pagination ? <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>{pagination}</Box> : null}</>}
  </PageCard>;
}
