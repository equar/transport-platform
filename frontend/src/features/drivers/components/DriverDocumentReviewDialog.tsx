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
import { PdfDocumentPreview } from "./PdfDocumentPreview";
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
  const [previewType, setPreviewType] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [openedSeparately, setOpenedSeparately] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
    setPreviewUrl(null); setPreviewError(false); setPreviewType("");
    setRenderError(false); setOpenedSeparately(false); setChecked(false); setPreviewBlob(null); setPdfReady(false); setImagePreviewUrl(null);
    if (open && document?.storagePath) {
      void driversApi.downloadDocument(document.id).then(async blob => {
        if (!active) return;
        // Use the authenticated response MIME type, never a filename or arbitrary
        // metadata. Never accept HTML or executable document content.
        const type = blob.type.split(";")[0].trim().toLowerCase();
        if (!["application/pdf", "image/png", "image/jpeg"].includes(type)) {
          throw new Error("Unsupported document preview type");
        }
        // Existing installations permit data: images but may still block blob:
        // images. Keep blob URLs for downloads only; never use them in a frame.
        const imageUrl = type.startsWith("image/") ? await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Image could not be read"));
          reader.readAsDataURL(blob);
        }) : null;
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImagePreviewUrl(imageUrl);
        setPreviewBlob(blob);
        setPreviewType(type);
        setPreviewUrl(objectUrl);
      }).catch(() => { if (active) setPreviewError(true); });
    }
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, document?.id, document?.updatedAt, document?.storagePath, attempt]);

  const reviewAvailable = Boolean(previewUrl) && (!renderError || openedSeparately) && (previewType !== "application/pdf" || pdfReady || openedSeparately);

  async function handleSubmit() {
    if (mode === "verify" && (!complete || !checked || !reviewAvailable)) {
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
                {renderError ? <Alert severity="warning">The preview couldn’t be displayed. Open or download the document to review it, or retry.</Alert>
                  : previewType.startsWith("image/")
                    ? <Box component="img" src={imagePreviewUrl ?? undefined} alt="Uploaded driver document"
                        onError={() => { setRenderError(true); setChecked(false); }}
                        sx={{ width: "100%", maxHeight: 420, objectFit: "contain" }} />
                    : previewBlob && <PdfDocumentPreview blob={previewBlob}
                        onReady={() => setPdfReady(true)}
                        onError={() => { setRenderError(true); setPdfReady(false); setChecked(false); }} />}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button component="a" href={previewUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpenedSeparately(true)}>Open full document</Button>
                  <Button component="a" href={previewUrl} download={document?.originalFileName || document?.fileName || "document"} onClick={() => setOpenedSeparately(true)}>Download document</Button>
                </Stack>
              </> : <Alert severity={previewError || !document?.storagePath ? "warning" : "info"}>
                {previewError ? "The file couldn’t be loaded as a PDF, PNG, or JPEG. Retry, or ask the driver to upload it again."
                  : !document?.storagePath ? "No uploaded file is available." : "Loading document…"}
              </Alert>}
              {(previewError || renderError) && <Button disabled={loading} onClick={() => setAttempt(value => value + 1)}>Retry preview</Button>}
            </Stack>
          </Box>
          {mode === "verify" ? <FormControlLabel control={<Checkbox checked={checked} disabled={loading || !complete || !reviewAvailable}
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
          disabled={loading || (mode === "verify" && (!complete || !checked || !reviewAvailable))}
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
