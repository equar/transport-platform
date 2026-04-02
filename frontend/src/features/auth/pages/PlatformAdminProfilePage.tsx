import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useState } from "react";
import { PageCard } from "../../../shared/components/PageCard";
import { useToast } from "../../../shared/providers/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";

export function PlatformAdminProfilePage() {
  const { session } = useAuth();
  const { showError, showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordUpdate() {
    if (!currentPassword.trim()) {
      setError("Current password is required.");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess(response.message);
    } catch (caughtError) {
      const message =
        typeof caughtError === "object" &&
        caughtError !== null &&
        "response" in caughtError &&
        typeof (caughtError as {
          response?: { data?: { error?: { message?: string } } };
        }).response?.data?.error?.message === "string"
          ? (caughtError as {
              response?: { data?: { error?: { message?: string } } };
            }).response?.data?.error?.message ??
            "Password could not be updated."
          : "Password could not be updated.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">My Profile</Typography>
          <Typography color="text.secondary">
            Review your platform account details and update your password while
            you are signed in.
          </Typography>
        </Stack>
      </PageCard>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Platform account</Typography>
          <TextField
            label="Display Name"
            value={
              [session?.identity.firstName, session?.identity.lastName]
                .filter(Boolean)
                .join(" ") || session?.identity.email || ""
            }
            disabled
            fullWidth
          />
          <TextField
            label="Email"
            value={session?.identity.email ?? ""}
            disabled
            fullWidth
          />
          <TextField
            label="Workspace"
            value="Platform scope"
            disabled
            fullWidth
          />
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Update password</Typography>
          <Typography color="text.secondary">
            Use your current password to set a new password for this platform
            administrator account.
          </Typography>
          <TextField
            label="Current Password"
            type={currentPasswordVisible ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        currentPasswordVisible
                          ? "Hide current password"
                          : "Show current password"
                      }
                      edge="end"
                      onClick={() =>
                        setCurrentPasswordVisible((current) => !current)
                      }
                    >
                      {currentPasswordVisible ? (
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
          <TextField
            label="New Password"
            type={newPasswordVisible ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText="Minimum 8 characters."
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        newPasswordVisible
                          ? "Hide new password"
                          : "Show new password"
                      }
                      edge="end"
                      onClick={() => setNewPasswordVisible((current) => !current)}
                    >
                      {newPasswordVisible ? (
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
          <TextField
            label="Confirm New Password"
            type={confirmPasswordVisible ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        confirmPasswordVisible
                          ? "Hide confirmed password"
                          : "Show confirmed password"
                      }
                      edge="end"
                      onClick={() =>
                        setConfirmPasswordVisible((current) => !current)
                      }
                    >
                      {confirmPasswordVisible ? (
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              onClick={handlePasswordUpdate}
              disabled={saving}
            >
              {saving ? "Updating password..." : "Update password"}
            </Button>
          </Stack>
        </Stack>
      </PageCard>
    </Stack>
  );
}