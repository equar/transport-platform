import { Box, Button, Stack, Typography } from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { PageCard } from "../../shared/components/PageCard";

interface RouterState {
  from?: {
    pathname?: string;
  };
}

export function UnauthorizedPage() {
  const location = useLocation();
  const attemptedPath = (location.state as RouterState | null)?.from?.pathname;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageCard sx={{ maxWidth: 720, mx: "auto" }}>
        <Stack spacing={2} alignItems="flex-start">
          <ReportProblemRoundedIcon color="warning" fontSize="large" />
          <Typography variant="h3">Unauthorized Access</Typography>
          <Typography color="text.secondary">
            Your account is authenticated, but it does not currently have the
            required permission to access this area.
          </Typography>
          {attemptedPath ? (
            <Typography variant="body2" color="text.secondary">
              Requested route: {attemptedPath}
            </Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={RouterLink} to="/" variant="contained">
              Return to Dashboard
            </Button>
            <Button component={RouterLink} to="/login" color="inherit">
              Switch Account
            </Button>
          </Stack>
        </Stack>
      </PageCard>
    </Box>
  );
}
