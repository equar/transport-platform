import { Box, Stack, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useRuntimeCapabilities } from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { BrandMark } from "../../shared/components/BrandMark";

export function AuthLayout() {
  const { branding } = useRuntimeCapabilities();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(18, 112, 112, 0.16), transparent 36%), linear-gradient(180deg, #f6f7f4 0%, #eef1eb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 1120 }}>
        <Stack spacing={1}>
          <BrandMark />
          <Typography variant="h2" sx={{ maxWidth: 640 }}>
            {branding?.customLoginWelcomeText ||
              "Transportation operations, tenancy, and security foundations in one platform shell."}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 720 }}
          >
            {branding?.customFooterText ||
              "This initial frontend focuses on architecture and delivery scaffolding. Business workflows and authenticated experiences will be added in bounded implementation batches."}
          </Typography>
        </Stack>
        <Outlet />
      </Stack>
    </Box>
  );
}
