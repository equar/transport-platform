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
  RiderGender,
  RiderMobilityNeed,
  RiderPayload,
  RiderRecord,
  RiderType,
} from "../api/ridersApi";
import {
  riderGenderOptions,
  riderMobilityNeedOptions,
  riderTypeOptions,
} from "../api/ridersApi";

interface RiderUpsertDialogProps {
  open: boolean;
  rider: RiderRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: RiderPayload) => Promise<void>;
}

function emptyForm(): RiderPayload {
  return {
    riderType: "STUDENT",
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: null,
    email: "",
    primaryPhone: "",
    alternatePhone: "",
    homeAddressLine1: "",
    homeAddressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    defaultPickupAddress: "",
    defaultDropoffAddress: "",
    pickupNotes: "",
    dropoffNotes: "",
    preferredPickupWindowStart: "",
    preferredPickupWindowEnd: "",
    preferredDropoffWindowStart: "",
    preferredDropoffWindowEnd: "",
    mobilityNeeds: [],
    wheelchairRequired: false,
    escortRequired: false,
    specialInstructions: "",
    careNotesSummary: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    organizationId: null,
    notes: "",
  };
}

function toFormValue(value?: string | null) {
  return value ?? "";
}

function toTimeValue(value?: string | null) {
  return value ? value.slice(0, 5) : "";
}

export function RiderUpsertDialog({
  open,
  rider,
  loading,
  onClose,
  onSubmit,
}: RiderUpsertDialogProps) {
  const [form, setForm] = useState<RiderPayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    if (!rider) {
      setForm(emptyForm());
      return;
    }
    setForm({
      riderType: rider.riderType,
      firstName: rider.firstName,
      middleName: toFormValue(rider.middleName),
      lastName: rider.lastName,
      dateOfBirth: toFormValue(rider.dateOfBirth),
      gender: rider.gender,
      email: toFormValue(rider.email),
      primaryPhone: rider.primaryPhone,
      alternatePhone: toFormValue(rider.alternatePhone),
      homeAddressLine1: toFormValue(rider.homeAddressLine1),
      homeAddressLine2: toFormValue(rider.homeAddressLine2),
      city: toFormValue(rider.city),
      state: toFormValue(rider.state),
      zipCode: toFormValue(rider.zipCode),
      country: toFormValue(rider.country),
      defaultPickupAddress: toFormValue(rider.defaultPickupAddress),
      defaultDropoffAddress: toFormValue(rider.defaultDropoffAddress),
      pickupNotes: toFormValue(rider.pickupNotes),
      dropoffNotes: toFormValue(rider.dropoffNotes),
      preferredPickupWindowStart: toTimeValue(rider.preferredPickupWindowStart),
      preferredPickupWindowEnd: toTimeValue(rider.preferredPickupWindowEnd),
      preferredDropoffWindowStart: toTimeValue(
        rider.preferredDropoffWindowStart,
      ),
      preferredDropoffWindowEnd: toTimeValue(rider.preferredDropoffWindowEnd),
      mobilityNeeds: rider.mobilityNeeds,
      wheelchairRequired: rider.wheelchairRequired,
      escortRequired: rider.escortRequired,
      specialInstructions: toFormValue(rider.specialInstructions),
      careNotesSummary: toFormValue(rider.careNotesSummary),
      emergencyContactName: toFormValue(rider.emergencyContactName),
      emergencyContactPhone: toFormValue(rider.emergencyContactPhone),
      emergencyContactRelationship: toFormValue(
        rider.emergencyContactRelationship,
      ),
      organizationId: rider.organizationId,
      notes: toFormValue(rider.notes),
    });
  }, [open, rider]);

  function updateField<Key extends keyof RiderPayload>(
    field: Key,
    value: RiderPayload[Key],
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
    if (!form.primaryPhone.trim()) {
      nextErrors.primaryPhone = "Primary phone is required.";
    } else if (!phonePattern.test(form.primaryPhone)) {
      nextErrors.primaryPhone = "Primary phone must be a valid phone number.";
    }
    if (form.alternatePhone && !phonePattern.test(form.alternatePhone)) {
      nextErrors.alternatePhone =
        "Alternate phone must be a valid phone number.";
    }
    if (
      form.emergencyContactPhone &&
      !phonePattern.test(form.emergencyContactPhone)
    ) {
      nextErrors.emergencyContactPhone =
        "Emergency contact phone must be a valid phone number.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Email must be a valid email address.";
    }
    if (form.dateOfBirth) {
      const today = new Date();
      const dob = new Date(form.dateOfBirth);
      if (dob > today) {
        nextErrors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }
    if (
      form.preferredPickupWindowStart &&
      form.preferredPickupWindowEnd &&
      form.preferredPickupWindowEnd < form.preferredPickupWindowStart
    ) {
      nextErrors.preferredPickupWindowEnd =
        "Pickup window end must be later than the start.";
    }
    if (
      form.preferredDropoffWindowStart &&
      form.preferredDropoffWindowEnd &&
      form.preferredDropoffWindowEnd < form.preferredDropoffWindowStart
    ) {
      nextErrors.preferredDropoffWindowEnd =
        "Dropoff window end must be later than the start.";
    }
    if ((form.organizationId ?? 0) < 0) {
      nextErrors.organizationId =
        "Organization reference must be positive when provided.";
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
      maxWidth="lg"
      scroll="paper"
    >
      <DialogTitle>{rider ? "Update Rider" : "Create Rider"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Rider Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Rider Type"
                select
                value={form.riderType}
                onChange={(event) =>
                  updateField("riderType", event.target.value as RiderType)
                }
                fullWidth
              >
                {riderTypeOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
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
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth ?? ""}
                onChange={(event) =>
                  updateField("dateOfBirth", event.target.value)
                }
                error={Boolean(errors.dateOfBirth)}
                helperText={errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Gender"
                select
                value={form.gender ?? ""}
                onChange={(event) =>
                  updateField(
                    "gender",
                    (event.target.value || null) as RiderGender | null,
                  )
                }
                fullWidth
              >
                <MenuItem value="">No selection</MenuItem>
                {riderGenderOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Organization Reference ID"
                type="number"
                value={form.organizationId ?? ""}
                onChange={(event) =>
                  updateField(
                    "organizationId",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                error={Boolean(errors.organizationId)}
                helperText={
                  errors.organizationId ??
                  "Optional future-ready organization linkage."
                }
                fullWidth
              />
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
                label="Primary Phone"
                value={form.primaryPhone}
                onChange={(event) =>
                  updateField("primaryPhone", event.target.value)
                }
                error={Boolean(errors.primaryPhone)}
                helperText={errors.primaryPhone}
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
                label="Home Address Line 1"
                value={form.homeAddressLine1 ?? ""}
                onChange={(event) =>
                  updateField("homeAddressLine1", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Home Address Line 2"
                value={form.homeAddressLine2 ?? ""}
                onChange={(event) =>
                  updateField("homeAddressLine2", event.target.value)
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
              Pickup and Dropoff Preferences
            </Typography>
            <TextField
              label="Default Pickup Address"
              value={form.defaultPickupAddress ?? ""}
              onChange={(event) =>
                updateField("defaultPickupAddress", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Default Dropoff Address"
              value={form.defaultDropoffAddress ?? ""}
              onChange={(event) =>
                updateField("defaultDropoffAddress", event.target.value)
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Preferred Pickup Window Start"
                type="time"
                value={form.preferredPickupWindowStart ?? ""}
                onChange={(event) =>
                  updateField("preferredPickupWindowStart", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Preferred Pickup Window End"
                type="time"
                value={form.preferredPickupWindowEnd ?? ""}
                onChange={(event) =>
                  updateField("preferredPickupWindowEnd", event.target.value)
                }
                error={Boolean(errors.preferredPickupWindowEnd)}
                helperText={errors.preferredPickupWindowEnd}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Preferred Dropoff Window Start"
                type="time"
                value={form.preferredDropoffWindowStart ?? ""}
                onChange={(event) =>
                  updateField("preferredDropoffWindowStart", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Preferred Dropoff Window End"
                type="time"
                value={form.preferredDropoffWindowEnd ?? ""}
                onChange={(event) =>
                  updateField("preferredDropoffWindowEnd", event.target.value)
                }
                error={Boolean(errors.preferredDropoffWindowEnd)}
                helperText={errors.preferredDropoffWindowEnd}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Pickup Notes"
              value={form.pickupNotes ?? ""}
              onChange={(event) =>
                updateField("pickupNotes", event.target.value)
              }
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              label="Dropoff Notes"
              value={form.dropoffNotes ?? ""}
              onChange={(event) =>
                updateField("dropoffNotes", event.target.value)
              }
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Accessibility and Support Needs
            </Typography>
            <TextField
              label="Mobility Needs"
              select
              value={form.mobilityNeeds}
              onChange={(event) => {
                const value = event.target.value;
                updateField(
                  "mobilityNeeds",
                  typeof value === "string"
                    ? (value.split(",") as RiderMobilityNeed[])
                    : (value as RiderMobilityNeed[]),
                );
              }}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (selected as string[]).join(", "),
              }}
              helperText="Record the core mobility support needs relevant for future scheduling and dispatch."
              fullWidth
            >
              {riderMobilityNeedOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.wheelchairRequired}
                    onChange={(event) =>
                      updateField("wheelchairRequired", event.target.checked)
                    }
                  />
                }
                label="Wheelchair Required"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.escortRequired}
                    onChange={(event) =>
                      updateField("escortRequired", event.target.checked)
                    }
                  />
                }
                label="Escort Required"
              />
            </Stack>
            <TextField
              label="Special Instructions"
              value={form.specialInstructions ?? ""}
              onChange={(event) =>
                updateField("specialInstructions", event.target.value)
              }
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              label="Care Notes Summary"
              value={form.careNotesSummary ?? ""}
              onChange={(event) =>
                updateField("careNotesSummary", event.target.value)
              }
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Emergency Contact
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Emergency Contact Name"
                value={form.emergencyContactName ?? ""}
                onChange={(event) =>
                  updateField("emergencyContactName", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Emergency Contact Phone"
                value={form.emergencyContactPhone ?? ""}
                onChange={(event) =>
                  updateField("emergencyContactPhone", event.target.value)
                }
                error={Boolean(errors.emergencyContactPhone)}
                helperText={errors.emergencyContactPhone}
                fullWidth
              />
              <TextField
                label="Emergency Contact Relationship"
                value={form.emergencyContactRelationship ?? ""}
                onChange={(event) =>
                  updateField(
                    "emergencyContactRelationship",
                    event.target.value,
                  )
                }
                fullWidth
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
          {loading ? "Saving..." : rider ? "Save Changes" : "Create Rider"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
