import { env } from "../../../shared/config/env";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Button,
  IconButton,
  InputAdornment,
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
import { useToast } from "../../../shared/providers/ToastProvider";
import { getApiErrorMessage } from "../../../shared/api/client";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const targetPath =
    (location.state as RouterState | null)?.from?.pathname ?? "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

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
        email: normalizedEmail,
        password,
      });
      showSuccess("Signed in successfully.");
      navigate(resolvePostLoginRoute(session, targetPath), { replace: true });
    } catch (error) {
      setError(
        getApiErrorMessage(error, "Sign-in failed. Verify your email, password, and account status, then try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  function handlePasswordVisibilityToggle() {
    setPasswordVisible((current) => !current);
  }

  useEffect(() => {
    const authNotice = consumeAuthNotice();
    if (authNotice) {
      setNotice(authNotice.message);
    }

  }, []);

  const status = error
    ? { severity: "error" as const, message: error }
    : notice
      ? { severity: "warning" as const, message: notice }
      : null;

  return (
    <AuthFormShell
      eyebrow="BAKAROO WORKSPACE"
      title="Welcome back."
      description="Sign in to manage your team. Riders, drivers and guardians sign in only through the Bakaroo Transport mobile app."
      status={status}
      footer={<Typography variant="body2" color="text.secondary">Need access? Contact your workspace administrator or <Link href={env.publicSiteUrl + "/contact"}>get in touch</Link>.</Typography>}
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email address"
          autoComplete="username"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required

          error={
            Boolean(error) &&
            (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
          }
        />
        <TextField
          label="Password"
          autoComplete="current-password"
          type={passwordVisible ? "text" : "password"}
          value={password}
          onChange={handlePasswordChange}
          required
          error={Boolean(error) && !password.trim()}

          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                    edge="end"
                    onClick={handlePasswordVisibilityToggle}
                  >
                    {passwordVisible ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth sx={{ mt: 1 }}>{submitting ? "Signing in…" : "Sign in to workspace"}</Button>

        <Typography variant="body2" color="text.secondary">

          <Link component={RouterLink} to="/forgot-password" underline="hover">
            Forgot password?
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link component={RouterLink} to="/verify-email" underline="hover">
            Verify tenant owner email
          </Link>
        </Typography>
      </Stack>
    </AuthFormShell>
  );
}
