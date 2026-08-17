import type { PropsWithChildren, ReactNode } from "react";
import { Box, Paper } from "@mui/material";
import { PageCard } from "./PageCard";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

export function DataTableShell({ loading, empty, emptyTitle, emptyDescription, pagination, children }: PropsWithChildren<{ loading: boolean; empty: boolean; emptyTitle: string; emptyDescription: string; pagination?: ReactNode }>) {
  return <PageCard sx={{ p: 0, overflow: "hidden", borderRadius: 3, boxShadow: "0 1px 2px rgba(16,30,38,.05), 0 18px 34px rgba(16,30,38,.045)" }}>
    {loading ? <LoadingState /> : empty ? <EmptyState title={emptyTitle} description={emptyDescription} /> : <><Paper sx={{ overflowX: "auto", borderRadius: 0, backgroundColor: "transparent" }}>{children}</Paper>{pagination ? <Box sx={{ borderTop: "1px solid", borderColor: "divider", backgroundColor: "#f8fafc" }}>{pagination}</Box> : null}</>}
  </PageCard>;
}
