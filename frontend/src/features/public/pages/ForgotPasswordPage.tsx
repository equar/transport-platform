import { useState, type FormEvent } from "react";
import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AuthFormShell } from "../../auth/components/AuthFormShell";
import { authApi } from "../../auth/api/authApi";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    setError(null);

    try {
      await authApi.requestPasswordReset({ email: normalizedEmail });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShell
      eyebrow="Account recovery"
      title="Request password recovery instructions."
      description="Enter the email address associated with your workspace account and we will send you instructions to reset your password."
      status={
        submitted
          ? {
              severity: "success",
              message:
                "If an account exists for that email address, you will receive password reset instructions shortly. Check your inbox and spam folder.",
            }
          : error
            ? { severity: "error", message: error }
            : null
      }
      footer={
        <Typography variant="body2" color="text.secondary">
          Remembered your credentials?{" "}
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            color="primary"
            fontWeight={700}
          >
            Back to Login
          </Link>
        </Typography>
      }
      maxWidth={640}
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Work Email"
          type="email"
          placeholder="ops@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          error={
            Boolean(error) &&
            (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
          }
          helperText="Use the email address associated with your transportation workspace."
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send recovery instructions"}
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
