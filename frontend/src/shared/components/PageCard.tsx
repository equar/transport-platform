import type { PropsWithChildren } from "react";
import { Paper } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { spacingTokens } from "../theme/tokens";

interface PageCardProps extends PropsWithChildren {
  variant?: "default" | "outlined" | "elevated";
  sx?: SxProps<Theme>;
}

export function PageCard({ children, sx, variant = "default" }: PageCardProps) {
  const variantSx: Record<NonNullable<PageCardProps["variant"]>, Record<string, unknown>> = {
    default: {
      border: 0,
      boxShadow: "none",
    },
    outlined: {
      border: "1px solid",
      borderColor: "rgba(23,43,64,.10)",
      boxShadow: "none",
    },
    elevated: {
      border: 0,
      boxShadow: "none",
    },
  };

  const customSx = (sx ?? {}) as Record<string, unknown>;

  return (
    <Paper
      elevation={0}
      sx={{
        px: spacingTokens.pageCardX,
        py: spacingTokens.pageCardY,
        backgroundColor: "background.paper",
        borderRadius: 1.5,
        ...variantSx[variant],
        ...customSx,
      }}
    >
      {children}
    </Paper>
  );
}
