import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AuthFormShell } from "../../features/auth/components/AuthFormShell";

export function NotFoundPage() {
  return (
    <AuthFormShell
      eyebrow="Page not found"
      title="That page does not exist in this workspace."
      description="The link may be outdated, the route may have changed, or the page may not be available in this environment."
      aside={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TravelExploreRoundedIcon color="secondary" fontSize="large" />
          <Typography variant="body2" color="text.secondary">
            Use the main navigation or return home to continue.
          </Typography>
        </Stack>
      }
      footer={
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            size="large"
          >
            Go to Home
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
          >
            Sign in
          </Button>
          <Button
            component={RouterLink}
            to="/contact"
            color="inherit"
            size="large"
          >
            Contact support
          </Button>
        </Stack>
      }
      maxWidth={720}
    >
      <Typography variant="body2" color="text.secondary">
        If you expected to reach a protected area, sign in first and continue
        from the correct workspace menu.
      </Typography>
    </AuthFormShell>
  );
}
