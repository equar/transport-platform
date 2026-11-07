import { Box } from "@mui/material";
import { useRuntimeCapabilities } from "../../features/runtime/context/RuntimeCapabilitiesContext";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  const { branding } = useRuntimeCapabilities();
  const logoUrl = branding?.logoUrl || "/branding/bakaroo-logo.png";

  return (
    <Box
      component="img"
      src={logoUrl}
      alt={`${branding?.displayName || "Bakaroo Transports"} logo`}
      sx={compact
        ? { width: 138, maxWidth: "100%", height: 36, objectFit: "contain", objectPosition: "left center", flexShrink: 0 }
        : { width: "min(100%, 320px)", height: "auto", objectFit: "contain" }}
    />
  );
}
