import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, Outlet } from "react-router-dom";
import {
  publicPrimaryCta,
  publicSecondaryCta,
} from "../../features/public/content/siteContent";
import { useRuntimeCapabilities } from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { BrandMark } from "../../shared/components/BrandMark";

export function AuthLayout() {
  const { branding } = useRuntimeCapabilities();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(18, 112, 112, 0.16), transparent 30%), radial-gradient(circle at right, rgba(196, 106, 34, 0.12), transparent 28%), linear-gradient(180deg, #f6f7f4 0%, #eef1eb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          display: "grid",
          gap: 4,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
          },
          alignItems: "center",
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 560 }}>
          <BrandMark />
          <Typography variant="h2">
            {branding?.customLoginWelcomeText ||
              "Secure transportation operations, tenant governance, and role-aware access from one platform."}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {branding?.customFooterText ||
              "The public website now leads naturally into authentication, onboarding, and account recovery without breaking the product experience."}
          </Typography>
          <Stack spacing={1.25}>
            <Typography color="text.secondary">
              Tenant-aware sign-in for platform and company access
            </Typography>
            <Typography color="text.secondary">
              Recovery flows structured cleanly for future backend wiring
            </Typography>
            <Typography color="text.secondary">
              Public-to-private navigation that stays aligned with the SaaS
              shell
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to={publicSecondaryCta.to}
              variant="outlined"
              size="large"
            >
              {publicSecondaryCta.label}
            </Button>
            <Button
              component={RouterLink}
              to={publicPrimaryCta.to}
              variant="contained"
              size="large"
            >
              {publicPrimaryCta.label}
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Need help with access? Contact support or request a guided workspace
            walkthrough.
          </Typography>
        </Stack>

        <Outlet />
      </Box>
    </Box>
  );
}
