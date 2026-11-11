import { useState, type FormEvent } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { useLocation } from "react-router-dom";
import { AuthFormShell } from "../components/AuthFormShell";
import { authApi } from "../api/authApi";
import { getApiErrorMessage } from "../../../shared/api/client";

export function VerifyApplicationEmailPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token") ?? "";
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [recovery, setRecovery] = useState(!token);
  const [status, setStatus] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  async function verify() {
    setBusy(true);
    try {
      const result = await authApi.verifyApplicationEmail(token);
      setVerified(true);
      setStatus({ severity: "success", message: result.message });
      window.history.replaceState(null, "", location.pathname);
    } catch (error) {
      setStatus({ severity: "error", message: getApiErrorMessage(error, "Email verification failed. Please try again.") });
    } finally { setBusy(false); }
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await authApi.resendApplicationVerification(reference);
      setStatus({ severity: "success", message: result.message });
    } catch (error) {
      setStatus({ severity: "error", message: getApiErrorMessage(error, "Could not send a verification link. Please try again.") });
    } finally { setBusy(false); }
  }

  return <AuthFormShell eyebrow="Tenant application" title="Verify your application email"
    description="Confirm your email to make your application ready for administrator review. You will create a password only after approval."
    status={status}>
    {!verified && <Stack spacing={2}>
      {token && !recovery && <>
        <Button variant="contained" disabled={busy} onClick={() => void verify()}>Verify email</Button>
        {status?.severity === "error" && <Button onClick={() => setRecovery(true)}>Request a new verification link</Button>}
      </>}
      {recovery && <Stack component="form" spacing={2} onSubmit={resend}>
        <TextField label="Application reference" required value={reference}
          inputProps={{ maxLength: 50 }} onChange={event => setReference(event.target.value)} />
        <Button type="submit" disabled={busy}>Send a new verification link</Button>
      </Stack>}
    </Stack>}
  </AuthFormShell>;
}
