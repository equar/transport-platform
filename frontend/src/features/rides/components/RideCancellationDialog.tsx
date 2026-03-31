import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface RideCancellationDialogProps {
  open: boolean;
  loading: boolean;
  rideLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function RideCancellationDialog({
  open,
  loading,
  rideLabel,
  onClose,
  onSubmit,
}: RideCancellationDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setReason("");
    setError(null);
  }, [open]);

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Cancellation reason is required.");
      return;
    }
    await onSubmit(reason.trim());
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Cancel Ride</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            Provide a cancellation reason for {rideLabel}.
          </Typography>
          <TextField
            label="Cancellation Reason"
            multiline
            minRows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
            error={Boolean(error)}
            helperText={
              error ??
              "Required for audit history and future operational follow-up."
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Keep Ride
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? "Cancelling..." : "Cancel Ride"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
