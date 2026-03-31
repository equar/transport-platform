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
import {
  rideBillingTypeOptions,
  rideCreateStatusOptions,
  ridePriorityOptions,
  ridesApi,
  rideTripTypeOptions,
  serviceTypeOptions,
  type LookupOption,
  type RidePayload,
  type RideRecord,
  type RideTripType,
} from "../api/ridesApi";

interface RideUpsertDialogProps {
  open: boolean;
  ride: RideRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: RidePayload) => Promise<void>;
}

function emptyForm(): RidePayload {
  return {
    riderId: null,
    guardianId: null,
    organizationId: null,
    contractId: null,
    serviceAreaId: null,
    serviceType: "GENERAL_TRANSPORT",
    tripType: "ONE_WAY",
    pickupAddressLine1: "",
    pickupAddressLine2: "",
    pickupCity: "",
    pickupState: "",
    pickupZipCode: "",
    pickupCountry: "US",
    dropoffAddressLine1: "",
    dropoffAddressLine2: "",
    dropoffCity: "",
    dropoffState: "",
    dropoffZipCode: "",
    dropoffCountry: "US",
    scheduledPickupAt: "",
    scheduledDropoffAt: "",
    returnPickupAt: "",
    returnDropoffAt: "",
    wheelchairRequired: false,
    escortRequired: false,
    companionCount: 0,
    specialInstructions: "",
    internalNotes: "",
    operationalNotes: "",
    priorityLevel: "STANDARD",
    billingType: null,
    status: "REQUESTED",
  };
}

function toInputDateTime(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.slice(0, 16);
}

function toNullableNumber(value: string) {
  return value ? Number(value) : null;
}

export function RideUpsertDialog({
  open,
  ride,
  loading,
  onClose,
  onSubmit,
}: RideUpsertDialogProps) {
  const [form, setForm] = useState<RidePayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [riderOptions, setRiderOptions] = useState<LookupOption[]>([]);
  const [guardianOptions, setGuardianOptions] = useState<LookupOption[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<
    LookupOption[]
  >([]);
  const [contractOptions, setContractOptions] = useState<LookupOption[]>([]);
  const [serviceAreaOptions, setServiceAreaOptions] = useState<LookupOption[]>(
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    if (!ride) {
      setForm(emptyForm());
    } else {
      setForm({
        riderId: ride.riderId,
        guardianId: ride.guardianId,
        organizationId: ride.organizationId,
        contractId: ride.contractId,
        serviceAreaId: ride.serviceAreaId,
        serviceType: ride.serviceType,
        tripType: ride.tripType,
        pickupAddressLine1: ride.pickupAddressLine1,
        pickupAddressLine2: ride.pickupAddressLine2 ?? "",
        pickupCity: ride.pickupCity,
        pickupState: ride.pickupState,
        pickupZipCode: ride.pickupZipCode,
        pickupCountry: ride.pickupCountry,
        dropoffAddressLine1: ride.dropoffAddressLine1,
        dropoffAddressLine2: ride.dropoffAddressLine2 ?? "",
        dropoffCity: ride.dropoffCity,
        dropoffState: ride.dropoffState,
        dropoffZipCode: ride.dropoffZipCode,
        dropoffCountry: ride.dropoffCountry,
        scheduledPickupAt: toInputDateTime(ride.scheduledPickupAt),
        scheduledDropoffAt: toInputDateTime(ride.scheduledDropoffAt),
        returnPickupAt: toInputDateTime(ride.returnPickupAt),
        returnDropoffAt: toInputDateTime(ride.returnDropoffAt),
        wheelchairRequired: ride.wheelchairRequired,
        escortRequired: ride.escortRequired,
        companionCount: ride.companionCount,
        specialInstructions: ride.specialInstructions ?? "",
        internalNotes: ride.internalNotes ?? "",
        operationalNotes: ride.operationalNotes ?? "",
        priorityLevel: ride.priorityLevel,
        billingType: ride.billingType,
        status: "REQUESTED",
      });
    }
    setReferenceLoading(true);
    void Promise.all([
      ridesApi.listRiderOptions(),
      ridesApi.listOrganizationOptions(),
      ridesApi.listContractOptions(),
      ridesApi.listServiceAreaOptions(),
    ])
      .then(([riders, organizations, contracts, serviceAreas]) => {
        setRiderOptions(riders);
        setOrganizationOptions(organizations);
        setContractOptions(contracts);
        setServiceAreaOptions(serviceAreas);
      })
      .finally(() => setReferenceLoading(false));
  }, [open, ride]);

  useEffect(() => {
    if (!open || !form.riderId) {
      setGuardianOptions([]);
      return;
    }
    void ridesApi
      .listGuardianOptionsForRider(form.riderId)
      .then(setGuardianOptions);
  }, [form.riderId, open]);

  const filteredContracts = form.organizationId
    ? contractOptions.filter(
        (option) => option.relatedOrganizationId === form.organizationId,
      )
    : contractOptions;

  function setField<K extends keyof RidePayload>(
    field: K,
    value: RidePayload[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate(current: RidePayload) {
    const nextErrors: Record<string, string> = {};
    if (!current.riderId) {
      nextErrors.riderId = "Rider is required.";
    }
    if (!current.pickupAddressLine1.trim()) {
      nextErrors.pickupAddressLine1 = "Pickup address line 1 is required.";
    }
    if (!current.pickupCity.trim()) {
      nextErrors.pickupCity = "Pickup city is required.";
    }
    if (!current.dropoffAddressLine1.trim()) {
      nextErrors.dropoffAddressLine1 = "Dropoff address line 1 is required.";
    }
    if (!current.dropoffCity.trim()) {
      nextErrors.dropoffCity = "Dropoff city is required.";
    }
    if (!current.scheduledPickupAt) {
      nextErrors.scheduledPickupAt = "Scheduled pickup time is required.";
    }
    if (
      current.scheduledPickupAt &&
      current.scheduledDropoffAt &&
      current.scheduledDropoffAt < current.scheduledPickupAt
    ) {
      nextErrors.scheduledDropoffAt =
        "Scheduled dropoff time cannot be earlier than pickup time.";
    }
    if (current.tripType === "ROUND_TRIP") {
      if (!current.returnPickupAt || !current.returnDropoffAt) {
        nextErrors.returnPickupAt =
          "Return pickup and dropoff times are required for round trips.";
      }
      if (
        current.returnPickupAt &&
        current.scheduledDropoffAt &&
        current.returnPickupAt < current.scheduledDropoffAt
      ) {
        nextErrors.returnPickupAt =
          "Return pickup time cannot be earlier than the scheduled dropoff time.";
      }
      if (
        current.returnPickupAt &&
        current.returnDropoffAt &&
        current.returnDropoffAt < current.returnPickupAt
      ) {
        nextErrors.returnDropoffAt =
          "Return dropoff time cannot be earlier than return pickup time.";
      }
    }
    if (
      current.tripType === "ONE_WAY" &&
      (current.returnPickupAt || current.returnDropoffAt)
    ) {
      nextErrors.returnPickupAt =
        "Return trip fields must stay empty for one-way rides.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate(form)) {
      return;
    }
    await onSubmit({
      ...form,
      pickupAddressLine1: form.pickupAddressLine1.trim(),
      pickupAddressLine2: form.pickupAddressLine2?.trim() || null,
      pickupCity: form.pickupCity.trim(),
      pickupState: form.pickupState.trim(),
      pickupZipCode: form.pickupZipCode.trim(),
      pickupCountry: form.pickupCountry.trim(),
      dropoffAddressLine1: form.dropoffAddressLine1.trim(),
      dropoffAddressLine2: form.dropoffAddressLine2?.trim() || null,
      dropoffCity: form.dropoffCity.trim(),
      dropoffState: form.dropoffState.trim(),
      dropoffZipCode: form.dropoffZipCode.trim(),
      dropoffCountry: form.dropoffCountry.trim(),
      specialInstructions: form.specialInstructions?.trim() || null,
      internalNotes: form.internalNotes?.trim() || null,
      operationalNotes: form.operationalNotes?.trim() || null,
      scheduledDropoffAt: form.scheduledDropoffAt || null,
      returnPickupAt:
        form.tripType === "ROUND_TRIP" ? form.returnPickupAt || null : null,
      returnDropoffAt:
        form.tripType === "ROUND_TRIP" ? form.returnDropoffAt || null : null,
      guardianId: form.guardianId ?? null,
      organizationId: form.organizationId ?? null,
      contractId: form.contractId ?? null,
      serviceAreaId: form.serviceAreaId ?? null,
      status: ride ? null : form.status,
    });
  }

  function sectionTitle(title: string, description: string) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>{ride ? "Update Ride" : "Create Ride"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {sectionTitle(
            "Rider and Organization Context",
            "Select the rider and optional linked contract, guardian, and service area context.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Rider"
              value={form.riderId ?? ""}
              onChange={(event) => {
                const riderId = toNullableNumber(event.target.value);
                setField("riderId", riderId);
                setField("guardianId", null);
              }}
              fullWidth
              error={Boolean(errors.riderId)}
              helperText={errors.riderId}
              disabled={referenceLoading}
            >
              {riderOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.code ? `${option.code} · ` : ""}
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Guardian"
              value={form.guardianId ?? ""}
              onChange={(event) =>
                setField("guardianId", toNullableNumber(event.target.value))
              }
              fullWidth
              disabled={!form.riderId}
            >
              <MenuItem value="">No guardian</MenuItem>
              {guardianOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Organization"
              value={form.organizationId ?? ""}
              onChange={(event) => {
                const organizationId = toNullableNumber(event.target.value);
                setField("organizationId", organizationId);
                if (
                  form.contractId &&
                  !filteredContracts.some(
                    (option) => option.id === form.contractId,
                  )
                ) {
                  setField("contractId", null);
                }
              }}
              fullWidth
            >
              <MenuItem value="">No organization</MenuItem>
              {organizationOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.code ? `${option.code} · ` : ""}
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Contract"
              value={form.contractId ?? ""}
              onChange={(event) =>
                setField("contractId", toNullableNumber(event.target.value))
              }
              fullWidth
            >
              <MenuItem value="">No contract</MenuItem>
              {filteredContracts.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.code ? `${option.code} · ` : ""}
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Service Area"
              value={form.serviceAreaId ?? ""}
              onChange={(event) =>
                setField("serviceAreaId", toNullableNumber(event.target.value))
              }
              fullWidth
            >
              <MenuItem value="">No service area</MenuItem>
              {serviceAreaOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.code ? `${option.code} · ` : ""}
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {!ride ? (
              <TextField
                select
                label="Initial Status"
                value={form.status ?? "REQUESTED"}
                onChange={(event) =>
                  setField(
                    "status",
                    event.target.value as RidePayload["status"],
                  )
                }
                fullWidth
              >
                {rideCreateStatusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Stack>

          {sectionTitle(
            "Trip Details",
            "Capture service type, lifecycle readiness, and scheduling intent for this ride.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Service Type"
              value={form.serviceType}
              onChange={(event) =>
                setField(
                  "serviceType",
                  event.target.value as RidePayload["serviceType"],
                )
              }
              fullWidth
            >
              {serviceTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Trip Type"
              value={form.tripType}
              onChange={(event) =>
                setField("tripType", event.target.value as RideTripType)
              }
              fullWidth
            >
              {rideTripTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority Level"
              value={form.priorityLevel ?? ""}
              onChange={(event) =>
                setField(
                  "priorityLevel",
                  (event.target.value || null) as RidePayload["priorityLevel"],
                )
              }
              fullWidth
            >
              <MenuItem value="">Not set</MenuItem>
              {ridePriorityOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Billing Type"
              value={form.billingType ?? ""}
              onChange={(event) =>
                setField(
                  "billingType",
                  (event.target.value || null) as RidePayload["billingType"],
                )
              }
              fullWidth
            >
              <MenuItem value="">Not set</MenuItem>
              {rideBillingTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Scheduled Pickup"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledPickupAt}
              onChange={(event) =>
                setField("scheduledPickupAt", event.target.value)
              }
              fullWidth
              error={Boolean(errors.scheduledPickupAt)}
              helperText={errors.scheduledPickupAt}
            />
            <TextField
              label="Scheduled Dropoff"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledDropoffAt ?? ""}
              onChange={(event) =>
                setField("scheduledDropoffAt", event.target.value)
              }
              fullWidth
              error={Boolean(errors.scheduledDropoffAt)}
              helperText={errors.scheduledDropoffAt}
            />
          </Stack>

          {sectionTitle(
            "Pickup Information",
            "Use operationally precise pickup details that dispatch and service teams can act on later.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Pickup Address Line 1"
              value={form.pickupAddressLine1}
              onChange={(event) =>
                setField("pickupAddressLine1", event.target.value)
              }
              fullWidth
              error={Boolean(errors.pickupAddressLine1)}
              helperText={errors.pickupAddressLine1}
            />
            <TextField
              label="Pickup Address Line 2"
              value={form.pickupAddressLine2 ?? ""}
              onChange={(event) =>
                setField("pickupAddressLine2", event.target.value)
              }
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Pickup City"
              value={form.pickupCity}
              onChange={(event) => setField("pickupCity", event.target.value)}
              fullWidth
              error={Boolean(errors.pickupCity)}
              helperText={errors.pickupCity}
            />
            <TextField
              label="Pickup State"
              value={form.pickupState}
              onChange={(event) => setField("pickupState", event.target.value)}
              fullWidth
            />
            <TextField
              label="Pickup Zip Code"
              value={form.pickupZipCode}
              onChange={(event) =>
                setField("pickupZipCode", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Pickup Country"
              value={form.pickupCountry}
              onChange={(event) =>
                setField("pickupCountry", event.target.value)
              }
              fullWidth
            />
          </Stack>

          {sectionTitle(
            "Dropoff Information",
            "Capture the delivery destination with the same level of operational precision.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Dropoff Address Line 1"
              value={form.dropoffAddressLine1}
              onChange={(event) =>
                setField("dropoffAddressLine1", event.target.value)
              }
              fullWidth
              error={Boolean(errors.dropoffAddressLine1)}
              helperText={errors.dropoffAddressLine1}
            />
            <TextField
              label="Dropoff Address Line 2"
              value={form.dropoffAddressLine2 ?? ""}
              onChange={(event) =>
                setField("dropoffAddressLine2", event.target.value)
              }
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Dropoff City"
              value={form.dropoffCity}
              onChange={(event) => setField("dropoffCity", event.target.value)}
              fullWidth
              error={Boolean(errors.dropoffCity)}
              helperText={errors.dropoffCity}
            />
            <TextField
              label="Dropoff State"
              value={form.dropoffState}
              onChange={(event) => setField("dropoffState", event.target.value)}
              fullWidth
            />
            <TextField
              label="Dropoff Zip Code"
              value={form.dropoffZipCode}
              onChange={(event) =>
                setField("dropoffZipCode", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Dropoff Country"
              value={form.dropoffCountry}
              onChange={(event) =>
                setField("dropoffCountry", event.target.value)
              }
              fullWidth
            />
          </Stack>

          {sectionTitle(
            "Return Trip Information",
            "Round-trip rides require a coherent return pickup and return dropoff sequence.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Return Pickup"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.returnPickupAt ?? ""}
              onChange={(event) =>
                setField("returnPickupAt", event.target.value)
              }
              fullWidth
              disabled={form.tripType !== "ROUND_TRIP"}
              error={Boolean(errors.returnPickupAt)}
              helperText={errors.returnPickupAt}
            />
            <TextField
              label="Return Dropoff"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.returnDropoffAt ?? ""}
              onChange={(event) =>
                setField("returnDropoffAt", event.target.value)
              }
              fullWidth
              disabled={form.tripType !== "ROUND_TRIP"}
              error={Boolean(errors.returnDropoffAt)}
              helperText={errors.returnDropoffAt}
            />
          </Stack>

          {sectionTitle(
            "Accessibility and Companion Needs",
            "Make operational support requirements explicit from the start.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Companion Count"
              type="number"
              value={form.companionCount}
              onChange={(event) =>
                setField("companionCount", Number(event.target.value || 0))
              }
              fullWidth
              inputProps={{ min: 0, max: 10 }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.wheelchairRequired}
                    onChange={(event) =>
                      setField("wheelchairRequired", event.target.checked)
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
                      setField("escortRequired", event.target.checked)
                    }
                  />
                }
                label="Escort Required"
              />
            </Stack>
          </Stack>

          {sectionTitle(
            "Notes and Instructions",
            "Capture rider-facing instructions separately from internal operational notes.",
          )}
          <Stack spacing={2}>
            <TextField
              label="Special Instructions"
              multiline
              minRows={2}
              value={form.specialInstructions ?? ""}
              onChange={(event) =>
                setField("specialInstructions", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Internal Notes"
              multiline
              minRows={2}
              value={form.internalNotes ?? ""}
              onChange={(event) =>
                setField("internalNotes", event.target.value)
              }
              fullWidth
            />
            <TextField
              label="Operational Notes"
              multiline
              minRows={2}
              value={form.operationalNotes ?? ""}
              onChange={(event) =>
                setField("operationalNotes", event.target.value)
              }
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Close
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={loading || referenceLoading}
        >
          {loading ? "Saving..." : ride ? "Update Ride" : "Create Ride"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
