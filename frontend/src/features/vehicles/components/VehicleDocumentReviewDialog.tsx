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
import type { VehicleDocumentRecord } from "../api/vehiclesApi";

interface VehicleDocumentReviewDialogProps {
  open: boolean;
  mode: "verify" | "reject";
  document: VehicleDocumentRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
}

export function VehicleDocumentReviewDialog({
  open,
  mode,
  document,
  loading,
  onClose,
  onSubmit,
}: VehicleDocumentReviewDialogProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setNotes(document?.notes ?? "");
    setError(null);
  }, [document, open]);

  async function handleSubmit() {
    if (mode === "reject" && !notes.trim()) {
      setError("Notes are required when rejecting a vehicle document.");
      return;
    }
    await onSubmit(notes);
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {mode === "verify"
          ? "Verify Vehicle Document"
          : "Reject Vehicle Document"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            {mode === "verify"
              ? "Confirm this vehicle document as verified. Add optional notes to preserve review context."
              : "Reject this vehicle document and capture the reason so compliance follow-up is clear to administrators."}
          </Typography>
          <TextField
            label="Notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setError(null);
            }}
            error={Boolean(error)}
            helperText={error ?? (mode === "reject" ? "Required" : "Optional")}
            multiline
            minRows={4}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          color={mode === "verify" ? "success" : "error"}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : mode === "verify"
              ? "Verify Document"
              : "Reject Document"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
