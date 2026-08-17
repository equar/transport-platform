import type { PropsWithChildren } from "react";
import { Paper } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface PageCardProps extends PropsWithChildren {
  sx?: SxProps<Theme>;
}

export function PageCard({ children, sx }: PageCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.25, md: 2.75 },
        border: "1px solid",
        borderColor: "rgba(37,76,99,.12)",
        backgroundColor: "background.paper",
        borderRadius: 3,
        boxShadow: "0 1px 2px rgba(16,30,38,.04), 0 14px 34px rgba(16,30,38,.05)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}
