import { Button, Stack, Typography } from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { AuthFormShell } from "../../features/auth/components/AuthFormShell";

interface RouterState {
  from?: {
    pathname?: string;
  };
  fallbackTo?: string;
}

export function UnauthorizedPage() {
  const location = useLocation();
  const { isAuthenticated, getDefaultRoute } = useAuth();
  const attemptedPath = (location.state as RouterState | null)?.from?.pathname;
  const fallbackPath =
    (location.state as RouterState | null)?.fallbackTo ?? getDefaultRoute();

  return (
    <AuthFormShell
      eyebrow="Access denied"
      title="Your account does not have access to this area."
      description="You are signed in, but the requested workspace, role, or module is not available for this account right now."
      tone="warning"
      aside={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ReportProblemRoundedIcon color="warning" fontSize="large" />
          {attemptedPath ? (
            <Typography variant="body2" color="text.secondary">
              Requested route: {attemptedPath}
            </Typography>
          ) : null}
        </Stack>
      }
      footer={
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {isAuthenticated ? (
            <Button
              component={RouterLink}
              to={fallbackPath}
              variant="contained"
              size="large"
            >
              Go to available workspace
            </Button>
          ) : (
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              size="large"
            >
              Go to Home
            </Button>
          )}
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
          >
            Sign in with another account
          </Button>
        </Stack>
      }
      maxWidth={720}
    >
      {attemptedPath ? (
        <Typography variant="body2" color="text.secondary">
          If you still need this route, ask an administrator to verify that the
          required role and tenant-scoped access have been assigned to your
          account.
        </Typography>
      ) : null}
    </AuthFormShell>
  );
}
