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
  VehicleFuelType,
  VehicleOwnershipType,
  VehiclePayload,
  VehicleRecord,
} from "../api/vehiclesApi";
import { vehicleServiceTypeOptions } from "../api/vehiclesApi";

const ownershipTypes: VehicleOwnershipType[] = [
  "COMPANY_OWNED",
  "DRIVER_OWNED",
  "LEASED",
];

const fuelTypes: VehicleFuelType[] = [
  "GASOLINE",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
  "PROPANE",
  "OTHER",
];

interface VehicleUpsertDialogProps {
  open: boolean;
  vehicle: VehicleRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: VehiclePayload) => Promise<void>;
}

function emptyForm(): VehiclePayload {
  return {
    ownershipType: "COMPANY_OWNED",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vin: "",
    plateNumber: "",
    plateState: "",
    capacity: 1,
    wheelchairCapacity: 0,
    serviceTypesSupported: [],
    fuelType: null,
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    registrationExpiryDate: "",
    inspectionExpiryDate: "",
    mileage: null,
    assignedDriverId: null,
    notes: "",
  };
}

function toFormValue(value?: string | null) {
  return value ?? "";
}

export function VehicleUpsertDialog({
  open,
  vehicle,
  loading,
  onClose,
  onSubmit,
}: VehicleUpsertDialogProps) {
  const [form, setForm] = useState<VehiclePayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    if (!vehicle) {
      setForm(emptyForm());
      return;
    }

    setForm({
      ownershipType: vehicle.ownershipType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: toFormValue(vehicle.color),
      vin: toFormValue(vehicle.vin),
      plateNumber: vehicle.plateNumber,
      plateState: vehicle.plateState,
      capacity: vehicle.capacity,
      wheelchairCapacity: vehicle.wheelchairCapacity ?? 0,
      serviceTypesSupported: vehicle.serviceTypesSupported,
      fuelType: vehicle.fuelType,
      insurancePolicyNumber: toFormValue(vehicle.insurancePolicyNumber),
      insuranceExpiryDate: toFormValue(vehicle.insuranceExpiryDate),
      registrationExpiryDate: toFormValue(vehicle.registrationExpiryDate),
      inspectionExpiryDate: toFormValue(vehicle.inspectionExpiryDate),
      mileage: vehicle.mileage,
      assignedDriverId: vehicle.assignedDriverId,
      notes: toFormValue(vehicle.notes),
    });
  }, [open, vehicle]);

  function updateField<Key extends keyof VehiclePayload>(
    field: Key,
    value: VehiclePayload[Key],
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
    const maxYear = new Date().getFullYear() + 1;

    if (!form.make.trim()) {
      nextErrors.make = "Make is required.";
    }
    if (!form.model.trim()) {
      nextErrors.model = "Model is required.";
    }
    if (form.year < 1980 || form.year > maxYear) {
      nextErrors.year = `Year must be between 1980 and ${maxYear}.`;
    }
    if (!form.plateNumber.trim()) {
      nextErrors.plateNumber = "Plate number is required.";
    }
    if (!form.plateState.trim()) {
      nextErrors.plateState = "Plate state is required.";
    }
    if (form.vin && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(form.vin)) {
      nextErrors.vin =
        "VIN must be a valid 17-character vehicle identification number.";
    }
    if (form.capacity < 1) {
      nextErrors.capacity = "Capacity must be at least 1.";
    }
    if ((form.wheelchairCapacity ?? 0) < 0) {
      nextErrors.wheelchairCapacity = "Wheelchair capacity cannot be negative.";
    }
    if ((form.wheelchairCapacity ?? 0) > form.capacity) {
      nextErrors.wheelchairCapacity =
        "Wheelchair capacity cannot exceed total capacity.";
    }
    if ((form.mileage ?? 0) < 0) {
      nextErrors.mileage = "Mileage cannot be negative.";
    }
    if ((form.assignedDriverId ?? 0) < 0) {
      nextErrors.assignedDriverId =
        "Assigned driver reference must be positive when provided.";
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
      <DialogTitle>{vehicle ? "Update Vehicle" : "Create Vehicle"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Vehicle Information
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Ownership Type"
                select
                value={form.ownershipType}
                onChange={(event) =>
                  updateField(
                    "ownershipType",
                    event.target.value as VehicleOwnershipType,
                  )
                }
                fullWidth
              >
                {ownershipTypes.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Make"
                value={form.make}
                onChange={(event) => updateField("make", event.target.value)}
                error={Boolean(errors.make)}
                helperText={errors.make}
                fullWidth
              />
              <TextField
                label="Model"
                value={form.model}
                onChange={(event) => updateField("model", event.target.value)}
                error={Boolean(errors.model)}
                helperText={errors.model}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Year"
                type="number"
                value={form.year}
                onChange={(event) =>
                  updateField("year", Number(event.target.value))
                }
                error={Boolean(errors.year)}
                helperText={errors.year}
                fullWidth
              />
              <TextField
                label="Color"
                value={form.color ?? ""}
                onChange={(event) => updateField("color", event.target.value)}
                fullWidth
              />
              <TextField
                label="Fuel Type"
                select
                value={form.fuelType ?? ""}
                onChange={(event) =>
                  updateField(
                    "fuelType",
                    (event.target.value || null) as VehicleFuelType | null,
                  )
                }
                fullWidth
              >
                <MenuItem value="">No selection</MenuItem>
                {fuelTypes.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="VIN"
                value={form.vin ?? ""}
                onChange={(event) => updateField("vin", event.target.value)}
                error={Boolean(errors.vin)}
                helperText={errors.vin}
                fullWidth
              />
              <TextField
                label="Assigned Driver Reference ID"
                type="number"
                value={form.assignedDriverId ?? ""}
                onChange={(event) =>
                  updateField(
                    "assignedDriverId",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                error={Boolean(errors.assignedDriverId)}
                helperText={
                  errors.assignedDriverId ??
                  "Optional future-ready reference for assignment workflows."
                }
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Registration Details
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Plate Number"
                value={form.plateNumber}
                onChange={(event) =>
                  updateField("plateNumber", event.target.value)
                }
                error={Boolean(errors.plateNumber)}
                helperText={errors.plateNumber}
                fullWidth
              />
              <TextField
                label="Plate State"
                value={form.plateState}
                onChange={(event) =>
                  updateField("plateState", event.target.value)
                }
                error={Boolean(errors.plateState)}
                helperText={errors.plateState}
                fullWidth
              />
              <TextField
                label="Registration Expiry Date"
                type="date"
                value={form.registrationExpiryDate ?? ""}
                onChange={(event) =>
                  updateField("registrationExpiryDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Insurance Details
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Insurance Policy Number"
                value={form.insurancePolicyNumber ?? ""}
                onChange={(event) =>
                  updateField("insurancePolicyNumber", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Insurance Expiry Date"
                type="date"
                value={form.insuranceExpiryDate ?? ""}
                onChange={(event) =>
                  updateField("insuranceExpiryDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Inspection Expiry Date"
                type="date"
                value={form.inspectionExpiryDate ?? ""}
                onChange={(event) =>
                  updateField("inspectionExpiryDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Capacity and Service Capabilities
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Capacity"
                type="number"
                value={form.capacity}
                onChange={(event) =>
                  updateField("capacity", Number(event.target.value))
                }
                error={Boolean(errors.capacity)}
                helperText={errors.capacity}
                fullWidth
              />
              <TextField
                label="Wheelchair Capacity"
                type="number"
                value={form.wheelchairCapacity ?? 0}
                onChange={(event) =>
                  updateField("wheelchairCapacity", Number(event.target.value))
                }
                error={Boolean(errors.wheelchairCapacity)}
                helperText={errors.wheelchairCapacity}
                fullWidth
              />
              <TextField
                label="Mileage"
                type="number"
                value={form.mileage ?? ""}
                onChange={(event) =>
                  updateField(
                    "mileage",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                error={Boolean(errors.mileage)}
                helperText={errors.mileage}
                fullWidth
              />
            </Stack>
            <TextField
              label="Service Types Supported"
              select
              value={form.serviceTypesSupported}
              onChange={(event) => {
                const value = event.target.value;
                updateField(
                  "serviceTypesSupported",
                  typeof value === "string" ? value.split(",") : value,
                );
              }}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (selected as string[]).join(", "),
              }}
              helperText="Choose the service capabilities this vehicle currently supports."
              fullWidth
            >
              {vehicleServiceTypeOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
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
          {loading ? "Saving..." : vehicle ? "Save Changes" : "Create Vehicle"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
