import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { normalizeBusinessError } from "../../../shared/api/businessError";
import { PageCard } from "../../../shared/components/PageCard";
import { useToast } from "../../../shared/providers/ToastProvider";
import { authApi } from "../api/authApi";

export function PasswordChangeCard() {
  const { showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("New password and confirmation must match.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      showSuccess(response.message);
    } catch (caughtError) {
      setError(normalizeBusinessError(caughtError, "Password could not be updated.").message);
    } finally {
      setSaving(false);
    }
  }

  const visibilityAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label={visible ? "Hide passwords" : "Show passwords"}
        edge="end"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <PageCard>
      <Stack spacing={2}>
        <Typography variant="h5">Account security</Typography>
        <Typography color="text.secondary">
          Change the password used to sign in to this account.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField label="Current Password" type={visible ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} slotProps={{ input: { endAdornment: visibilityAdornment } }} fullWidth />
        <TextField label="New Password" type={visible ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} helperText="Minimum 8 characters." slotProps={{ input: { endAdornment: visibilityAdornment } }} fullWidth />
        <TextField label="Confirm New Password" type={visible ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} slotProps={{ input: { endAdornment: visibilityAdornment } }} fullWidth />
        <Button variant="contained" onClick={submit} disabled={saving} sx={{ alignSelf: "flex-start" }}>
          {saving ? "Updating password..." : "Update password"}
        </Button>
      </Stack>
    </PageCard>
  );
}
