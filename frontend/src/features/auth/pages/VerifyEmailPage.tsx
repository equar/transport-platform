import { useState, type FormEvent } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AuthFormShell } from "../components/AuthFormShell";
import { authApi } from "../api/authApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { passwordValidationError } from "../../../shared/utils/passwordPolicy";

export function VerifyEmailPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRecovery, setShowRecovery] = useState(!token);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = passwordValidationError(password);
    if (problem || !password.trim()) {
      setStatus({ severity: "error", message: problem ?? "Enter a password." });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ severity: "error", message: "The confirmation password must match the new password." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const result = await authApi.verifyEmail(token, password);
      setVerified(true);
      setPassword("");
      setConfirmPassword("");
      setStatus({ severity: "success", message: result.message });
      window.history.replaceState(null, "", location.pathname);
    } catch (error) {
      setStatus({ severity: "error", message: getApiErrorMessage(error, "Account setup failed. Please try again.") });
    } finally {
      setBusy(false);
    }
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const result = await authApi.resendVerification(email);
      setStatus({ severity: "success", message: result.message });
    } catch (error) {
      setStatus({ severity: "error", message: getApiErrorMessage(error, "The verification email could not be requested. Please try again.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFormShell eyebrow="Tenant onboarding" title={token ? "Create your password" : "Request an account setup link"}
      description="Your application has been approved. Create your password to finish account setup and activate your workspace."
      status={status} maxWidth={640}>
      <Stack spacing={2}>
        {!verified && token && !showRecovery && <Stack component="form" spacing={2} onSubmit={verify}>
          <TextField label="New password" type="password" autoComplete="new-password" required
            value={password} disabled={busy} onChange={event => setPassword(event.target.value)}
            inputProps={{ minLength: 8, maxLength: 100 }} helperText="Use at least 8 characters." />
          <TextField label="Confirm password" type="password" autoComplete="new-password" required
            value={confirmPassword} disabled={busy} onChange={event => setConfirmPassword(event.target.value)}
            inputProps={{ minLength: 8, maxLength: 100 }} />
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Creating password..." : "Create password"}
          </Button>
          {status?.severity === "error" && <Button disabled={busy} onClick={() => setShowRecovery(true)}>
            Request a new setup link
          </Button>}
        </Stack>}
        {!verified && showRecovery && <Stack component="form" spacing={2} onSubmit={resend}>
          <TextField label="Owner email" type="email" required value={email} disabled={busy}
            inputProps={{ maxLength: 150 }} onChange={event => setEmail(event.target.value)} />
          <Button type="submit" variant="outlined" disabled={busy}>Send a new verification link</Button>
        </Stack>}
        <Button component={RouterLink} to="/login">Back to sign in</Button>
      </Stack>
    </AuthFormShell>
  );
}
