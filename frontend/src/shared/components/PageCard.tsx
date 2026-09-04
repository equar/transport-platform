import type { PropsWithChildren } from "react";
import { Paper } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { borderTokens, shadowTokens, spacingTokens } from "../theme/tokens";

interface PageCardProps extends PropsWithChildren {
  variant?: "default" | "outlined" | "elevated";
  sx?: SxProps<Theme>;
}

export function PageCard({ children, sx, variant = "default" }: PageCardProps) {
  const variantSx: Record<NonNullable<PageCardProps["variant"]>, Record<string, unknown>> = {
    default: {
      border: "1px solid",
      borderColor: borderTokens.subtle,
      boxShadow: shadowTokens.card,
    },
    outlined: {
      border: "1px solid",
      borderColor: "divider",
      boxShadow: "none",
    },
    elevated: {
      border: "none",
      boxShadow: shadowTokens.tableCard,
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
        borderRadius: 3,
        ...variantSx[variant],
        ...customSx,
      }}
    >
      {children}
    </Paper>
  );
}
