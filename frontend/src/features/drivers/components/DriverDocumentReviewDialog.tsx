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
import type { DriverDocumentRecord } from "../api/driversApi";

interface DriverDocumentReviewDialogProps {
  open: boolean;
  mode: "verify" | "reject";
  document: DriverDocumentRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
}

export function DriverDocumentReviewDialog({
  open,
  mode,
  document,
  loading,
  onClose,
  onSubmit,
}: DriverDocumentReviewDialogProps) {
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
      setError("Notes are required when rejecting a driver document.");
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
          ? "Verify Driver Document"
          : "Reject Driver Document"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            {mode === "verify"
              ? "Confirm this document as verified. Add optional notes to capture review context."
              : "Reject this document and capture the reason so the driver record retains the review outcome."}
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
