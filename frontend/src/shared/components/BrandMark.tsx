import { Stack, Typography } from "@mui/material";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Stack spacing={compact ? 0 : 0.25}>
      <Typography
        variant={compact ? "h6" : "overline"}
        sx={{
          letterSpacing: "0.18em",
          color: "secondary.main",
          fontWeight: 700,
        }}
      >
        TRANSPORT PLATFORM
      </Typography>
      <Typography variant={compact ? "body2" : "h4"} sx={{ fontWeight: 700 }}>
        Multi-tenant TMS foundation
      </Typography>
    </Stack>
  );
}
