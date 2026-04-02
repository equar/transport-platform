import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  publicPrimaryCta,
  publicSecondaryCta,
} from "../../public/content/siteContent";
import { useRuntimeCapabilities } from "../../runtime/context/RuntimeCapabilitiesContext";
import { BrandMark } from "../../../shared/components/BrandMark";

export function AuthMarketingPanel() {
  const { branding } = useRuntimeCapabilities();

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <BrandMark />
      <Typography variant="h2">
        {branding?.customLoginWelcomeText ||
          "Secure transportation operations, workspace governance, and role-aware access from one platform."}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {branding?.customFooterText ||
          "Sign in to manage day-to-day transportation operations, or use the links below to request a demo and begin onboarding."}
      </Typography>
      <Stack spacing={1.25}>
        <Typography color="text.secondary">
          Secure sign-in for platform and company access
        </Typography>
        <Typography color="text.secondary">
          Account recovery and onboarding stay in one branded flow
        </Typography>
        <Typography color="text.secondary">
          Public and private experiences use the same product language
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
        Need help with access? Contact support or request a guided product
        walkthrough.
      </Typography>
    </Stack>
  );
}
