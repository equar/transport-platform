import type { PropsWithChildren, ReactNode } from "react";
import { Box, Stack } from "@mui/material";

interface PageHeroProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  visual?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children, visual }: PageHeroProps) {
  void eyebrow;
  void title;
  void description;
  void visual;

  return (
    <Box sx={{ py: 0.5 }}>
      {children ? (
        <Stack
          direction="row"
          spacing={1.25}
          useFlexGap
          flexWrap="wrap"
          sx={{
            "& .MuiButton-root": {
              borderRadius: 1.5,
              px: 2,
              py: 1,
              fontWeight: 700,
            },
            "& .MuiButton-contained": {
              bgcolor: "primary.main",
              color: "common.white",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            },
            "& .MuiButton-outlined": {
              color: "primary.dark",
              borderColor: "primary.light",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            },
          }}
        >
          {children}
        </Stack>
      ) : null}
    </Box>
  );
}
