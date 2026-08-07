import type { PropsWithChildren, ReactNode } from "react";
import { Button, Stack } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { SectionHeader } from "./SectionHeader";

export function WorkspacePage({ eyebrow, title, description, primaryAction, secondaryActions, children }: PropsWithChildren<{ eyebrow?: string; title: string; description: string; primaryAction?: { label: string; onClick: () => void; icon?: ReactNode }; secondaryActions?: ReactNode }>) {
  return <Stack spacing={3}>
    <SectionHeader eyebrow={eyebrow} title={title} description={description}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        {secondaryActions}
        {primaryAction ? <Button variant="contained" startIcon={primaryAction.icon ?? <AddRoundedIcon />} onClick={primaryAction.onClick}>{primaryAction.label}</Button> : null}
      </Stack>
    </SectionHeader>
    {children}
  </Stack>;
}
