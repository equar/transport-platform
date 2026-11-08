import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
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
import { driversApi, type DriverDocumentRecord } from "../api/driversApi";

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
  const [checked, setChecked] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const isPhoto = document?.documentType === "PROFILE_PHOTO";
  const complete = isPhoto || Boolean(document?.documentNumber?.trim() && document?.issuingAuthority?.trim() && document?.issueDate && document?.expiryDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setChecked(false);
    setNotes(document?.notes ?? "");
    setError(null);
  }, [document, open]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setPreviewUrl(null); setPreviewError(false);
    if (open && document?.storagePath) {
      void driversApi.downloadDocument(document.id).then(blob => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setPreviewUrl(objectUrl); else URL.revokeObjectURL(objectUrl);
      }).catch(() => { if (active) setPreviewError(true); });
    }
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, document?.id, document?.updatedAt]);

  async function handleSubmit() {
    if (mode === "verify" && (!complete || !checked || !previewUrl)) {
      setError("Open the uploaded file and check all submitted details before verifying.");
      return;
    }
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
      maxWidth="md"
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
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.4fr" }, gap: 2 }}>
            <Stack spacing={1}>
              <Typography variant="h6">Submitted details</Typography>
              <Typography>Document: {document?.documentType.replaceAll("_", " ")}</Typography>
              <Typography>File: {document?.originalFileName || document?.fileName}</Typography>
              <Typography>Document number: {document?.documentNumber || "Not supplied"}</Typography>
              <Typography>Issuing authority: {document?.issuingAuthority || "Not supplied"}</Typography>
              <Typography>Issue date: {document?.issueDate || "Not supplied"}</Typography>
              <Typography>Expiry date: {document?.expiryDate || "Not supplied"}</Typography>
              {!complete ? <Alert severity="warning">Required details are missing. Update the document details before verifying, or reject it with a reason.</Alert> : null}
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h6">Uploaded document</Typography>
              {previewUrl ? <>
                {document?.contentType?.startsWith("image/")
                  ? <Box component="img" src={previewUrl} alt="Uploaded driver document" sx={{ width: "100%", maxHeight: 420, objectFit: "contain" }} />
                  : <Box component="iframe" src={previewUrl} title="Uploaded driver document" sandbox="" sx={{ width: "100%", height: 420, border: 1, borderColor: "divider" }} />}
                <Button component="a" href={previewUrl} target="_blank" rel="noopener noreferrer">Open full document</Button>
              </> : <Alert severity={previewError || !document?.storagePath ? "warning" : "info"}>
                {previewError ? "The uploaded file could not be loaded. Close and reopen this review to retry."
                  : !document?.storagePath ? "No uploaded file is available." : "Loading document…"}
              </Alert>}
            </Stack>
          </Box>
          {mode === "verify" ? <FormControlLabel control={<Checkbox checked={checked} disabled={loading || !complete || !previewUrl}
            onChange={event => setChecked(event.target.checked)} />}
            label={isPhoto ? "I checked the uploaded profile photo." : "I checked the document number, issuing authority, issue date, and expiry date against the uploaded file."} /> : null}
          <TextField
            label="Review notes"
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
          disabled={loading || (mode === "verify" && (!complete || !checked || !previewUrl))}
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
