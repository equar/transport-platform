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
        p: { xs: 3, md: 4 },
        borderRadius: 5,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(16px)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}
