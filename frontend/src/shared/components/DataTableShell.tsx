import type { PropsWithChildren, ReactNode } from "react";
import { Box, Paper } from "@mui/material";
import { PageCard } from "./PageCard";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

type DataTableShellProps = {
  loading: boolean;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  pagination?: ReactNode;
};

export function DataTableShell({
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  pagination,
  children,
}: PropsWithChildren<DataTableShellProps>) {
  return (
    <PageCard variant="elevated" sx={{ p: 0, overflow: "hidden", borderRadius: 3 }}>
      {loading ? (
        <LoadingState />
      ) : empty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <Paper sx={{ overflowX: "auto", borderRadius: 0, backgroundColor: "transparent" }}>
            {children}
          </Paper>
          {pagination ? (
            <Box sx={{ borderTop: "1px solid", borderColor: "divider", backgroundColor: "action.hover" }}>
              {pagination}
            </Box>
          ) : null}
        </>
      )}
    </PageCard>
  );
}
