import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Box,
  Button,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { AuthFormShell } from "../components/AuthFormShell";
import { resolvePostLoginRoute } from "../access";
import { useAuth } from "../context/AuthContext";
import { consumeAuthNotice } from "../utils/authNotices";
import { publicSecondaryCta } from "../../public/content/siteContent";
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
  const [notice, setNotice] = useState<string | null>(null);
  const [brandingPreview, setBrandingPreview] =
    useState<RuntimeBranding | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const targetPath =
    (location.state as RouterState | null)?.from?.pathname ?? "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTenantId = tenantId.trim();
    const normalizedEmail = email.trim();

    if (!normalizedTenantId) {
      setError(
        "Workspace ID is required. Use 'platform' for platform administration, or enter your company workspace ID.",
      );
      return;
    }

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const session = await signIn({
        tenantId: normalizedTenantId,
        email: normalizedEmail,
        password,
      });
      showSuccess("Signed in successfully.");
      navigate(resolvePostLoginRoute(session, targetPath), { replace: true });
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
    const authNotice = consumeAuthNotice();
    if (authNotice) {
      setNotice(authNotice.message);
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      if (!tenantId.trim()) {
        setBrandingPreview(null);
        return;
      }
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

  const status = error
    ? { severity: "error" as const, message: error }
    : notice
      ? { severity: "warning" as const, message: notice }
      : null;

  return (
    <AuthFormShell
      eyebrow="Secure sign in"
      title="Sign in to your transportation workspace."
      description={
        brandingPreview?.customLoginWelcomeText ||
        "Use your workspace ID, email address, and password to access your platform or company account."
      }
      status={status}
      footer={
        <Typography variant="body2" color="text.secondary">
          Transportation teams can get started through the{" "}
          <Link component={RouterLink} to="/apply" underline="hover">
            {publicSecondaryCta.label}
          </Link>{" "}
          page or{" "}
          <Link
            component={RouterLink}
            to="/contact#request-demo"
            underline="hover"
          >
            Request Demo
          </Link>
          . Need password help? Visit{" "}
          <Link component={RouterLink} to="/forgot-password" underline="hover">
            Forgot Password
          </Link>
          .
        </Typography>
      }
      aside={
        brandingPreview ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Workspace branding preview
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
                      "Preview the branding and support details for the selected workspace."}
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
        ) : undefined
      }
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Workspace ID"
          value={tenantId}
          onChange={handleTenantChange}
          helperText="Use 'platform' for platform administration, or enter your company workspace ID."
          error={Boolean(error) && !tenantId.trim()}
        />
        <TextField
          label="Work Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
          helperText="Use the email address assigned to your workspace account."
          error={
            Boolean(error) &&
            (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
          }
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          required
          error={Boolean(error) && !password.trim()}
          helperText="Use the password assigned to your workspace account."
        />

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
              : "Enter a workspace ID to preview branding before you sign in."}
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Forgot your password?{" "}
          <Link component={RouterLink} to="/forgot-password" underline="hover">
            Reset your password
          </Link>
          .
        </Typography>
      </Stack>
    </AuthFormShell>
  );
}
