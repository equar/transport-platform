import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { GuardianRecord } from "../../guardians/api/guardiansApi";
import type {
  RiderGuardianPayload,
  RiderGuardianRecord,
  RiderGuardianRelationshipType,
} from "../api/ridersApi";
import { riderGuardianRelationshipTypeOptions } from "../api/ridersApi";

interface GuardianLinkDialogProps {
  open: boolean;
  guardians: GuardianRecord[];
  relationship: RiderGuardianRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: RiderGuardianPayload) => Promise<void>;
}

function emptyForm(): RiderGuardianPayload {
  return {
    guardianId: 0,
    relationshipType: "PARENT",
    primaryGuardian: false,
    authorizedForPickup: false,
    billingContact: false,
    notes: "",
  };
}

export function GuardianLinkDialog({
  open,
  guardians,
  relationship,
  loading,
  onClose,
  onSubmit,
}: GuardianLinkDialogProps) {
  const [form, setForm] = useState<RiderGuardianPayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    if (!relationship) {
      setForm(emptyForm());
      return;
    }
    setForm({
      guardianId: relationship.guardianId,
      relationshipType: relationship.relationshipType,
      primaryGuardian: relationship.primaryGuardian,
      authorizedForPickup: relationship.authorizedForPickup,
      billingContact: relationship.billingContact,
      notes: relationship.notes ?? "",
    });
  }, [open, relationship]);

  const selectedGuardian = useMemo(
    () => guardians.find((guardian) => guardian.id === form.guardianId) ?? null,
    [form.guardianId, guardians],
  );

  function updateField<Key extends keyof RiderGuardianPayload>(
    field: Key,
    value: RiderGuardianPayload[Key],
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
    if (!form.guardianId) {
      nextErrors.guardianId = "Guardian selection is required.";
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
      maxWidth="sm"
    >
      <DialogTitle>
        {relationship ? "Update Guardian Link" : "Link Guardian"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Guardian"
            select
            value={form.guardianId || ""}
            onChange={(event) =>
              updateField("guardianId", Number(event.target.value))
            }
            error={Boolean(errors.guardianId)}
            helperText={errors.guardianId}
            disabled={Boolean(relationship)}
            fullWidth
          >
            <MenuItem value="">Select guardian</MenuItem>
            {guardians.map((guardian) => (
              <MenuItem key={guardian.id} value={guardian.id}>
                {guardian.firstName} {guardian.lastName}
                {guardian.email ? ` • ${guardian.email}` : ""}
              </MenuItem>
            ))}
          </TextField>
          {selectedGuardian ? (
            <Typography variant="body2" color="text.secondary">
              {selectedGuardian.phone}
              {selectedGuardian.relationToRiderDefault
                ? ` • ${selectedGuardian.relationToRiderDefault}`
                : ""}
            </Typography>
          ) : null}
          <TextField
            label="Relationship Type"
            select
            value={form.relationshipType}
            onChange={(event) =>
              updateField(
                "relationshipType",
                event.target.value as RiderGuardianRelationshipType,
              )
            }
            fullWidth
          >
            {riderGuardianRelationshipTypeOptions.map((value) => (
              <MenuItem key={value} value={value}>
                {value.replaceAll("_", " ")}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.primaryGuardian}
                  onChange={(event) =>
                    updateField("primaryGuardian", event.target.checked)
                  }
                />
              }
              label="Primary Guardian"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.authorizedForPickup}
                  onChange={(event) =>
                    updateField("authorizedForPickup", event.target.checked)
                  }
                />
              }
              label="Authorized for Pickup"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.billingContact}
                  onChange={(event) =>
                    updateField("billingContact", event.target.checked)
                  }
                />
              }
              label="Billing Contact"
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
          {loading
            ? "Saving..."
            : relationship
              ? "Save Changes"
              : "Link Guardian"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
