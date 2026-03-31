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
  DriverPayload,
  DriverQualificationStatus,
  DriverRecord,
  DriverTrainingStatus,
  DriverType,
} from "../api/driversApi";

interface DriverUpsertDialogProps {
  open: boolean;
  driver: DriverRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: DriverPayload) => Promise<void>;
}

const driverTypes: DriverType[] = ["EMPLOYEE", "CONTRACTOR"];
const qualificationStatuses: DriverQualificationStatus[] = [
  "PENDING",
  "CLEAR",
  "FAILED",
  "EXPIRED",
];
const trainingStatuses: DriverTrainingStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "EXPIRED",
];

function emptyForm(): DriverPayload {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    alternatePhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    driverType: "EMPLOYEE",
    hireDate: "",
    startDate: "",
    availabilitySummary: "",
    licenseNumber: "",
    licenseState: "",
    licenseExpiryDate: "",
    backgroundCheckStatus: "PENDING",
    backgroundCheckExpiryDate: "",
    drugTestStatus: "PENDING",
    drugTestExpiryDate: "",
    trainingStatus: "NOT_STARTED",
    trainingCompletionDate: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    notes: "",
  };
}

function toFormValue(value?: string | null) {
  return value ?? "";
}

export function DriverUpsertDialog({
  open,
  driver,
  loading,
  onClose,
  onSubmit,
}: DriverUpsertDialogProps) {
  const [form, setForm] = useState<DriverPayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    if (!driver) {
      setForm(emptyForm());
      return;
    }

    setForm({
      firstName: driver.firstName,
      middleName: toFormValue(driver.middleName),
      lastName: driver.lastName,
      dateOfBirth: toFormValue(driver.dateOfBirth),
      email: toFormValue(driver.email),
      phone: driver.phone,
      alternatePhone: toFormValue(driver.alternatePhone),
      addressLine1: toFormValue(driver.addressLine1),
      addressLine2: toFormValue(driver.addressLine2),
      city: toFormValue(driver.city),
      state: toFormValue(driver.state),
      zipCode: toFormValue(driver.zipCode),
      country: toFormValue(driver.country),
      driverType: driver.driverType,
      hireDate: toFormValue(driver.hireDate),
      startDate: toFormValue(driver.startDate),
      availabilitySummary: toFormValue(driver.availabilitySummary),
      licenseNumber: toFormValue(driver.licenseNumber),
      licenseState: toFormValue(driver.licenseState),
      licenseExpiryDate: toFormValue(driver.licenseExpiryDate),
      backgroundCheckStatus: driver.backgroundCheckStatus,
      backgroundCheckExpiryDate: toFormValue(driver.backgroundCheckExpiryDate),
      drugTestStatus: driver.drugTestStatus,
      drugTestExpiryDate: toFormValue(driver.drugTestExpiryDate),
      trainingStatus: driver.trainingStatus,
      trainingCompletionDate: toFormValue(driver.trainingCompletionDate),
      emergencyContactName: toFormValue(driver.emergencyContactName),
      emergencyContactPhone: toFormValue(driver.emergencyContactPhone),
      emergencyContactRelationship: toFormValue(
        driver.emergencyContactRelationship,
      ),
      notes: toFormValue(driver.notes),
    });
  }, [driver, open]);

  function updateField<Key extends keyof DriverPayload>(
    field: Key,
    value: DriverPayload[Key],
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

    if (!form.firstName?.trim()) {
      nextErrors.firstName = "First name is required.";
    }
    if (!form.lastName?.trim()) {
      nextErrors.lastName = "Last name is required.";
    }
    if (!form.phone?.trim()) {
      nextErrors.phone = "Phone is required.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (form.hireDate && form.startDate && form.startDate < form.hireDate) {
      nextErrors.startDate = "Start date cannot be earlier than hire date.";
    }
    if (form.trainingStatus === "COMPLETED" && !form.trainingCompletionDate) {
      nextErrors.trainingCompletionDate =
        "Training completion date is required when training is completed.";
    }
    if (form.trainingStatus !== "COMPLETED" && form.trainingCompletionDate) {
      nextErrors.trainingCompletionDate =
        "Training completion date can be set only when training is completed.";
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
      <DialogTitle>{driver ? "Update Driver" : "Create Driver"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Personal Information
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
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth ?? ""}
                onChange={(event) =>
                  updateField("dateOfBirth", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Driver Type"
                select
                value={form.driverType}
                onChange={(event) =>
                  updateField("driverType", event.target.value as DriverType)
                }
                fullWidth
              >
                {driverTypes.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Availability Summary"
                value={form.availabilitySummary ?? ""}
                onChange={(event) =>
                  updateField("availabilitySummary", event.target.value)
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
                type="email"
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
                fullWidth
              />
            </Stack>
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
              Employment Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Hire Date"
                type="date"
                value={form.hireDate ?? ""}
                onChange={(event) =>
                  updateField("hireDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Start Date"
                type="date"
                value={form.startDate ?? ""}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              License Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="License Number"
                value={form.licenseNumber ?? ""}
                onChange={(event) =>
                  updateField("licenseNumber", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="License State"
                value={form.licenseState ?? ""}
                onChange={(event) =>
                  updateField("licenseState", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="License Expiry Date"
                type="date"
                value={form.licenseExpiryDate ?? ""}
                onChange={(event) =>
                  updateField("licenseExpiryDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Compliance Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Background Check Status"
                select
                value={form.backgroundCheckStatus ?? "PENDING"}
                onChange={(event) =>
                  updateField(
                    "backgroundCheckStatus",
                    event.target.value as DriverQualificationStatus,
                  )
                }
                fullWidth
              >
                {qualificationStatuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Background Check Expiry"
                type="date"
                value={form.backgroundCheckExpiryDate ?? ""}
                onChange={(event) =>
                  updateField("backgroundCheckExpiryDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Drug Test Status"
                select
                value={form.drugTestStatus ?? "PENDING"}
                onChange={(event) =>
                  updateField(
                    "drugTestStatus",
                    event.target.value as DriverQualificationStatus,
                  )
                }
                fullWidth
              >
                {qualificationStatuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Drug Test Expiry"
                type="date"
                value={form.drugTestExpiryDate ?? ""}
                onChange={(event) =>
                  updateField("drugTestExpiryDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Training Status"
                select
                value={form.trainingStatus ?? "NOT_STARTED"}
                onChange={(event) =>
                  updateField(
                    "trainingStatus",
                    event.target.value as DriverTrainingStatus,
                  )
                }
                fullWidth
              >
                {trainingStatuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Training Completion Date"
                type="date"
                value={form.trainingCompletionDate ?? ""}
                onChange={(event) =>
                  updateField("trainingCompletionDate", event.target.value)
                }
                error={Boolean(errors.trainingCompletionDate)}
                helperText={errors.trainingCompletionDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
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
                fullWidth
              />
              <TextField
                label="Relationship"
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
          {loading ? "Saving..." : driver ? "Save Changes" : "Create Driver"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
