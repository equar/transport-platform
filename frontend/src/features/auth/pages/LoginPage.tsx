import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { PageCard } from "../../../shared/components/PageCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../../../shared/providers/ToastProvider";
import { runtimeApi, type RuntimeBranding } from "../../runtime/api/runtimeApi";

interface RouterState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { showSuccess } = useToast();
  const [tenantId, setTenantId] = useState("platform");
  const [email, setEmail] = useState("platform-admin@transport-platform.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [brandingPreview, setBrandingPreview] =
    useState<RuntimeBranding | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const targetPath =
    (location.state as RouterState | null)?.from?.pathname ?? "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await signIn({ tenantId, email, password });
      showSuccess("Signed in successfully.");
      navigate(
        targetPath === "/"
          ? session.identity.roles.includes("ROLE_PLATFORM_ADMIN")
            ? "/platform"
            : "/company"
          : targetPath,
        { replace: true },
      );
    } catch {
      setError(
        "Sign-in failed. Verify the tenant, email, password, and account status, then try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleTenantChange(event: ChangeEvent<HTMLInputElement>) {
    setTenantId(event.target.value);
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        const nextBranding = await runtimeApi.getTenantBranding(
          tenantId.trim(),
        );
        if (active) {
          setBrandingPreview(nextBranding);
        }
      } catch {
        if (active) {
          setBrandingPreview(null);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [tenantId]);

  return (
    <PageCard>
      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        <Box>
          <Typography variant="h4">Administrator Sign In</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {brandingPreview?.customLoginWelcomeText ||
              "Sign in with a platform or company administrator account to manage onboarding, users, role assignments, and operational access."}
          </Typography>
        </Box>

        {error ? <Alert severity="info">{error}</Alert> : null}

        <Stack spacing={2}>
          <TextField
            label="Tenant ID"
            value={tenantId}
            onChange={handleTenantChange}
            helperText="Use 'platform' for platform scope, or enter your company tenant ID."
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            fullWidth
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {brandingPreview?.displayName
              ? `Workspace: ${brandingPreview.displayName}`
              : "Platform bootstrap remains available for local development if the backend local profile keeps it enabled."}
          </Typography>
        </Stack>

        {brandingPreview ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Tenant branding preview
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    background: `linear-gradient(135deg, ${brandingPreview.primaryColor || "#0B5FFF"} 0%, ${brandingPreview.secondaryColor || brandingPreview.primaryColor || "#16324F"} 100%)`,
                  }}
                />
                <Stack spacing={0.5}>
                  <Typography variant="h6">
                    {brandingPreview.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {brandingPreview.customFooterText ||
                      "White-label sign-in preview for the selected tenant."}
                  </Typography>
                  {brandingPreview.supportEmail ? (
                    <Typography variant="body2" color="text.secondary">
                      Support: {brandingPreview.supportEmail}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Stack>
          </>
        ) : null}

        <Typography variant="body2" color="text.secondary">
          Transportation companies can submit onboarding requests through the{" "}
          <Link component={RouterLink} to="/apply" underline="hover">
            Apply to Join
          </Link>{" "}
          page.
        </Typography>
      </Stack>
    </PageCard>
  );
}
