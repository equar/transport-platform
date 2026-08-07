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
import { publicSecondaryCta } from "../../public/content/siteContent";
import { useToast } from "../../../shared/providers/ToastProvider";
import { normalizeBusinessError } from "../../../shared/api/businessError";

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
    } catch (signInError) {
      setError(normalizeBusinessError(
        signInError,
        "Sign-in failed. Verify your email, password, and account status.",
      ).message);
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
      eyebrow="Secure sign in"
      title="Sign in to your transportation account."
      description="Use your email address and password. Your assigned role determines the tools and information available after sign-in."
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
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Work Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
          helperText="Use the email address assigned to your account."
          error={
            Boolean(error) &&
            (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
          }
        />
        <TextField
          label="Password"
          type={passwordVisible ? "text" : "password"}
          value={password}
          onChange={handlePasswordChange}
          required
          error={Boolean(error) && !password.trim()}
          helperText="Use the password assigned to your account."
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
            Access is granted according to your assigned role.
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
