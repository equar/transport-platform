import { useState, type FormEvent } from "react";
import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { AuthFormShell } from "../../auth/components/AuthFormShell";
import { authApi } from "../../auth/api/authApi";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get("token")?.trim() ?? "";
  const reason = searchParams.get("reason");
  const tokenState = !token
    ? "missing"
    : reason === "expired" || token === "expired"
      ? "expired"
      : reason === "invalid" || token === "invalid"
        ? "invalid"
        : "ready";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (tokenState !== "ready") {
      setError(
        tokenState === "expired"
          ? "This reset link has expired. Request a new one to continue."
          : "This reset link is invalid. Request a new one to continue.",
      );
      return;
    }

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The confirmation password must match the new password.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authApi.resetPassword({ token, password });
      setSuccessMessage(response.message);
      setSubmitted(true);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "invalid";
      setError(
        message === "expired"
          ? "This reset link has expired. Request a new one to continue."
          : "This reset link is invalid. Request a new one to continue.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShell
      eyebrow="Password reset"
      title="Create a new password for your workspace access."
      description="Choose a new password for your workspace account. Use a valid reset link and create a password with at least 8 characters."
      status={
        submitted
          ? {
              severity: "success",
              message:
                successMessage ||
                "The password reset request completed successfully for this workspace.",
            }
          : tokenState === "expired"
            ? {
                severity: "warning",
                message:
                  "This reset link has expired. Request a new one to continue.",
              }
            : tokenState === "invalid" || tokenState === "missing"
              ? {
                  severity: "error",
                  message:
                    tokenState === "missing"
                      ? "A reset token is required in the URL before you can create a new password."
                      : "This reset link is invalid. Request a new one to continue.",
                }
              : error
                ? { severity: "error", message: error }
                : null
      }
      footer={
        <Typography variant="body2" color="text.secondary">
          Need a new link?{" "}
          <Link
            component={RouterLink}
            to="/forgot-password"
            underline="hover"
            color="primary"
            fontWeight={700}
          >
            Request password recovery
          </Link>
          .
        </Typography>
      }
      maxWidth={640}
      tone={tokenState === "ready" ? "default" : "warning"}
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="New Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={submitted || tokenState !== "ready"}
          error={Boolean(error) && password.length < 8}
          helperText="Use at least 8 characters."
        />
        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          disabled={submitted || tokenState !== "ready"}
          error={Boolean(error) && confirmPassword !== password}
          helperText="Re-enter the new password exactly as shown above."
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || submitted || tokenState !== "ready"}
          >
            {submitted
              ? "Password reset recorded"
              : submitting
                ? "Resetting..."
                : "Reset password"}
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
          >
            Back to Login
          </Button>
        </Stack>
      </Stack>
    </AuthFormShell>
  );
}
