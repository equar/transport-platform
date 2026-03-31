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
import { useEffect, useState } from "react";
import type {
  GuardianPayload,
  GuardianPreferredCommunicationMethod,
  GuardianRecord,
} from "../api/guardiansApi";
import { guardianPreferredCommunicationMethodOptions } from "../api/guardiansApi";

interface GuardianUpsertDialogProps {
  open: boolean;
  guardian: GuardianRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: GuardianPayload) => Promise<void>;
}

function emptyForm(): GuardianPayload {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    relationToRiderDefault: "",
    email: "",
    phone: "",
    alternatePhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    preferredCommunicationMethod: null,
    billingContact: false,
    authorizedForPickup: false,
    notes: "",
  };
}

function toFormValue(value?: string | null) {
  return value ?? "";
}

export function GuardianUpsertDialog({
  open,
  guardian,
  loading,
  onClose,
  onSubmit,
}: GuardianUpsertDialogProps) {
  const [form, setForm] = useState<GuardianPayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    if (!guardian) {
      setForm(emptyForm());
      return;
    }
    setForm({
      firstName: guardian.firstName,
      middleName: toFormValue(guardian.middleName),
      lastName: guardian.lastName,
      relationToRiderDefault: toFormValue(guardian.relationToRiderDefault),
      email: toFormValue(guardian.email),
      phone: guardian.phone,
      alternatePhone: toFormValue(guardian.alternatePhone),
      addressLine1: toFormValue(guardian.addressLine1),
      addressLine2: toFormValue(guardian.addressLine2),
      city: toFormValue(guardian.city),
      state: toFormValue(guardian.state),
      zipCode: toFormValue(guardian.zipCode),
      country: toFormValue(guardian.country),
      preferredCommunicationMethod: guardian.preferredCommunicationMethod,
      billingContact: guardian.billingContact,
      authorizedForPickup: guardian.authorizedForPickup,
      notes: toFormValue(guardian.notes),
    });
  }, [guardian, open]);

  function updateField<Key extends keyof GuardianPayload>(
    field: Key,
    value: GuardianPayload[Key],
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
    const phonePattern = /^[0-9+()\-\s]{7,50}$/;

    if (!form.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    }
    if (!form.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required.";
    } else if (!phonePattern.test(form.phone)) {
      nextErrors.phone = "Phone must be a valid phone number.";
    }
    if (form.alternatePhone && !phonePattern.test(form.alternatePhone)) {
      nextErrors.alternatePhone =
        "Alternate phone must be a valid phone number.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Email must be a valid email address.";
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
        {guardian ? "Update Guardian" : "Create Guardian"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Guardian Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="First Name"
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                error={Boolean(errors.firstName)}
                helperText={errors.firstName}
                fullWidth
              />
              <TextField
                label="Middle Name"
                value={form.middleName ?? ""}
                onChange={(event) =>
                  updateField("middleName", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                error={Boolean(errors.lastName)}
                helperText={errors.lastName}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Default Relationship to Rider"
                value={form.relationToRiderDefault ?? ""}
                onChange={(event) =>
                  updateField("relationToRiderDefault", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Preferred Communication Method"
                select
                value={form.preferredCommunicationMethod ?? ""}
                onChange={(event) =>
                  updateField(
                    "preferredCommunicationMethod",
                    (event.target.value ||
                      null) as GuardianPreferredCommunicationMethod | null,
                  )
                }
                fullWidth
              >
                <MenuItem value="">No selection</MenuItem>
                {guardianPreferredCommunicationMethodOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Contact Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Email"
                value={form.email ?? ""}
                onChange={(event) => updateField("email", event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                fullWidth
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
                fullWidth
              />
              <TextField
                label="Alternate Phone"
                value={form.alternatePhone ?? ""}
                onChange={(event) =>
                  updateField("alternatePhone", event.target.value)
                }
                error={Boolean(errors.alternatePhone)}
                helperText={errors.alternatePhone}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Address Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Address Line 1"
                value={form.addressLine1 ?? ""}
                onChange={(event) =>
                  updateField("addressLine1", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Address Line 2"
                value={form.addressLine2 ?? ""}
                onChange={(event) =>
                  updateField("addressLine2", event.target.value)
                }
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="City"
                value={form.city ?? ""}
                onChange={(event) => updateField("city", event.target.value)}
                fullWidth
              />
              <TextField
                label="State"
                value={form.state ?? ""}
                onChange={(event) => updateField("state", event.target.value)}
                fullWidth
              />
              <TextField
                label="ZIP Code"
                value={form.zipCode ?? ""}
                onChange={(event) => updateField("zipCode", event.target.value)}
                fullWidth
              />
              <TextField
                label="Country"
                value={form.country ?? ""}
                onChange={(event) => updateField("country", event.target.value)}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Contact Permissions
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Notes
            </Typography>
            <TextField
              label="Notes"
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
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
            : guardian
              ? "Save Changes"
              : "Create Guardian"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
