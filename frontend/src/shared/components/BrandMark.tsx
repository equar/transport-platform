import { Stack, Typography } from "@mui/material";
import { useRuntimeCapabilities } from "../../features/runtime/context/RuntimeCapabilitiesContext";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  const { branding } = useRuntimeCapabilities();

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
        {compact
          ? (branding?.displayName?.toUpperCase() ?? "TRANSPORT PLATFORM")
          : "TRANSPORT PLATFORM"}
      </Typography>
      <Typography variant={compact ? "body2" : "h4"} sx={{ fontWeight: 700 }}>
        {branding?.displayName || "Multi-tenant TMS foundation"}
      </Typography>
    </Stack>
  );
}
