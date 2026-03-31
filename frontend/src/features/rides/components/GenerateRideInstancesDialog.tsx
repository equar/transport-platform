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

interface GenerateRideInstancesDialogProps {
  open: boolean;
  loading: boolean;
  recurrenceCode: string;
  onClose: () => void;
  onSubmit: (payload: { fromDate: string; toDate: string }) => Promise<void>;
}

export function GenerateRideInstancesDialog({
  open,
  loading,
  recurrenceCode,
  onClose,
  onSubmit,
}: GenerateRideInstancesDialogProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFromDate("");
    setToDate("");
    setError(null);
  }, [open]);

  async function handleSubmit() {
    if (!fromDate || !toDate) {
      setError("Select both dates before generating ride instances.");
      return;
    }
    if (toDate < fromDate) {
      setError("End date cannot be earlier than the start date.");
      return;
    }
    await onSubmit({ fromDate, toDate });
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Generate Ride Instances</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            Create ride instances for recurring schedule {recurrenceCode} in a
            controlled date window.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="From Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setError(null);
              }}
              fullWidth
            />
            <TextField
              label="To Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setError(null);
              }}
              fullWidth
              error={Boolean(error)}
              helperText={
                error ?? "Duplicate ride instances are automatically prevented."
              }
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Close
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Ride Instances"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
