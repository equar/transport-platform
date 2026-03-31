import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type {
  DriverDocumentPayload,
  DriverDocumentRecord,
  DriverDocumentType,
} from "../api/driversApi";

interface DriverDocumentUpsertDialogProps {
  open: boolean;
  document: DriverDocumentRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: DriverDocumentPayload) => Promise<void>;
}

const documentTypes: DriverDocumentType[] = [
  "DRIVER_LICENSE",
  "BACKGROUND_CHECK",
  "DRUG_TEST",
  "CPR_FIRST_AID",
  "NEMT_CERTIFICATION",
  "SCHOOL_TRANSPORT_PERMIT",
  "PROFILE_PHOTO",
  "INSURANCE_PROOF",
  "W9",
  "CONTRACT_AGREEMENT",
  "OTHER",
];

function emptyForm(): DriverDocumentPayload {
  return {
    documentType: "DRIVER_LICENSE",
    fileName: "",
    originalFileName: "",
    contentType: "",
    storagePath: "",
    documentNumber: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  };
}

function toFormValue(value?: string | null) {
  return value ?? "";
}

export function DriverDocumentUpsertDialog({
  open,
  document,
  loading,
  onClose,
  onSubmit,
}: DriverDocumentUpsertDialogProps) {
  const [form, setForm] = useState<DriverDocumentPayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    if (!document) {
      setForm(emptyForm());
      return;
    }

    setForm({
      documentType: document.documentType,
      fileName: document.fileName,
      originalFileName: toFormValue(document.originalFileName),
      contentType: toFormValue(document.contentType),
      storagePath: toFormValue(document.storagePath),
      documentNumber: toFormValue(document.documentNumber),
      issuingAuthority: toFormValue(document.issuingAuthority),
      issueDate: toFormValue(document.issueDate),
      expiryDate: toFormValue(document.expiryDate),
      notes: toFormValue(document.notes),
    });
  }, [document, open]);

  function updateField<Key extends keyof DriverDocumentPayload>(
    field: Key,
    value: DriverDocumentPayload[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.fileName.trim()) {
      nextErrors.fileName = "File name is required.";
    }
    if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate) {
      nextErrors.expiryDate =
        "Expiry date cannot be earlier than the issue date.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }
    await onSubmit(form);
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {document ? "Update Driver Document" : "Add Driver Document"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Document Type"
              select
              value={form.documentType}
              onChange={(event) =>
                updateField(
                  "documentType",
                  event.target.value as DriverDocumentType,
                )
              }
              fullWidth
            >
              {documentTypes.map((value) => (
                <MenuItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="File Name"
              value={form.fileName}
              onChange={(event) => updateField("fileName", event.target.value)}
              error={Boolean(errors.fileName)}
              helperText={errors.fileName}
              fullWidth
            />
          </Stack>
          <Button
            component="label"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          >
            Select File Metadata
            <input
              hidden
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                setForm((current) => ({
                  ...current,
                  fileName: file.name,
                  originalFileName: file.name,
                  contentType: file.type || current.contentType,
                }));
              }}
            />
          </Button>
          <Typography variant="caption" color="text.secondary">
            File selection captures metadata only for this batch. Binary file
            storage integration can be connected later without changing the
            document model.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Original File Name"
              value={form.originalFileName ?? ""}
              onChange={(event) =>
                updateField("originalFileName", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Content Type"
              value={form.contentType ?? ""}
              onChange={(event) =>
                updateField("contentType", event.target.value)
              }
              fullWidth
            />
          </Stack>
          <TextField
            label="Storage Path"
            value={form.storagePath ?? ""}
            onChange={(event) => updateField("storagePath", event.target.value)}
            helperText="Optional storage reference for future attachment integration."
            fullWidth
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Document Number"
              value={form.documentNumber ?? ""}
              onChange={(event) =>
                updateField("documentNumber", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Issuing Authority"
              value={form.issuingAuthority ?? ""}
              onChange={(event) =>
                updateField("issuingAuthority", event.target.value)
              }
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Issue Date"
              type="date"
              value={form.issueDate ?? ""}
              onChange={(event) => updateField("issueDate", event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={form.expiryDate ?? ""}
              onChange={(event) =>
                updateField("expiryDate", event.target.value)
              }
              error={Boolean(errors.expiryDate)}
              helperText={errors.expiryDate}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Notes"
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            multiline
            minRows={3}
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
          disabled={loading}
        >
          {loading ? "Saving..." : document ? "Save Changes" : "Add Document"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
