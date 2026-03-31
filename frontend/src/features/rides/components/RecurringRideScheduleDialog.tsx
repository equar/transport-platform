import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  dayOfWeekOptions,
  recurrencePatternOptions,
  recurringRideCreateStatusOptions,
  rideBillingTypeOptions,
  ridesApi,
  rideTripTypeOptions,
  serviceTypeOptions,
  type LookupOption,
  type RecurringRideSchedulePayload,
  type RecurringRideScheduleRecord,
  type RideDayOfWeek,
  type RideTripType,
} from "../api/ridesApi";

interface RecurringRideScheduleDialogProps {
  open: boolean;
  schedule: RecurringRideScheduleRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: RecurringRideSchedulePayload) => Promise<void>;
}

function emptyForm(): RecurringRideSchedulePayload {
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
    scheduledPickupTime: "",
    scheduledDropoffTime: "",
    returnPickupTime: "",
    returnDropoffTime: "",
    recurrencePatternType: "WEEKLY",
    daysOfWeek: ["MONDAY"],
    intervalDays: null,
    startDate: "",
    endDate: "",
    occurrenceLimit: null,
    skipDates: [],
    wheelchairRequired: false,
    escortRequired: false,
    companionCount: 0,
    specialInstructions: "",
    internalNotes: "",
    billingType: null,
    status: "DRAFT",
  };
}

function toNullableNumber(value: string) {
  return value ? Number(value) : null;
}

function skipDatesToText(values: string[]) {
  return values.join(", ");
}

function parseSkipDates(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function RecurringRideScheduleDialog({
  open,
  schedule,
  loading,
  onClose,
  onSubmit,
}: RecurringRideScheduleDialogProps) {
  const [form, setForm] = useState<RecurringRideSchedulePayload>(emptyForm());
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
  const [skipDatesText, setSkipDatesText] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    if (!schedule) {
      setForm(emptyForm());
      setSkipDatesText("");
    } else {
      setForm({
        riderId: schedule.riderId,
        guardianId: schedule.guardianId,
        organizationId: schedule.organizationId,
        contractId: schedule.contractId,
        serviceAreaId: schedule.serviceAreaId,
        serviceType: schedule.serviceType,
        tripType: schedule.tripType,
        pickupAddressLine1: schedule.pickupAddressLine1,
        pickupAddressLine2: schedule.pickupAddressLine2 ?? "",
        pickupCity: schedule.pickupCity,
        pickupState: schedule.pickupState,
        pickupZipCode: schedule.pickupZipCode,
        pickupCountry: schedule.pickupCountry,
        dropoffAddressLine1: schedule.dropoffAddressLine1,
        dropoffAddressLine2: schedule.dropoffAddressLine2 ?? "",
        dropoffCity: schedule.dropoffCity,
        dropoffState: schedule.dropoffState,
        dropoffZipCode: schedule.dropoffZipCode,
        dropoffCountry: schedule.dropoffCountry,
        scheduledPickupTime: schedule.scheduledPickupTime.slice(0, 5),
        scheduledDropoffTime: schedule.scheduledDropoffTime?.slice(0, 5) ?? "",
        returnPickupTime: schedule.returnPickupTime?.slice(0, 5) ?? "",
        returnDropoffTime: schedule.returnDropoffTime?.slice(0, 5) ?? "",
        recurrencePatternType: schedule.recurrencePatternType,
        daysOfWeek: schedule.daysOfWeek,
        intervalDays: schedule.intervalDays,
        startDate: schedule.startDate,
        endDate: schedule.endDate ?? "",
        occurrenceLimit: schedule.occurrenceLimit,
        skipDates: schedule.skipDates,
        wheelchairRequired: schedule.wheelchairRequired,
        escortRequired: schedule.escortRequired,
        companionCount: schedule.companionCount,
        specialInstructions: schedule.specialInstructions ?? "",
        internalNotes: schedule.internalNotes ?? "",
        billingType: schedule.billingType,
        status: "DRAFT",
      });
      setSkipDatesText(skipDatesToText(schedule.skipDates));
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
  }, [open, schedule]);

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

  function setField<K extends keyof RecurringRideSchedulePayload>(
    field: K,
    value: RecurringRideSchedulePayload[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function toggleDay(day: RideDayOfWeek) {
    setForm((current) => {
      const exists = current.daysOfWeek.includes(day);
      return {
        ...current,
        daysOfWeek: exists
          ? current.daysOfWeek.filter((value) => value !== day)
          : [...current.daysOfWeek, day],
      };
    });
  }

  function validate(current: RecurringRideSchedulePayload) {
    const nextErrors: Record<string, string> = {};
    if (!current.riderId) {
      nextErrors.riderId = "Rider is required.";
    }
    if (!current.startDate) {
      nextErrors.startDate = "Start date is required.";
    }
    if (!current.scheduledPickupTime) {
      nextErrors.scheduledPickupTime = "Scheduled pickup time is required.";
    }
    if (current.endDate && current.endDate < current.startDate) {
      nextErrors.endDate = "End date cannot be earlier than the start date.";
    }
    if (
      current.scheduledDropoffTime &&
      current.scheduledDropoffTime < current.scheduledPickupTime
    ) {
      nextErrors.scheduledDropoffTime =
        "Scheduled dropoff time cannot be earlier than the scheduled pickup time.";
    }
    if (current.tripType === "ROUND_TRIP") {
      if (!current.returnPickupTime || !current.returnDropoffTime) {
        nextErrors.returnPickupTime =
          "Return pickup and return dropoff times are required for round trips.";
      }
      if (
        current.returnPickupTime &&
        current.scheduledDropoffTime &&
        current.returnPickupTime < current.scheduledDropoffTime
      ) {
        nextErrors.returnPickupTime =
          "Return pickup time cannot be earlier than the scheduled dropoff time.";
      }
      if (
        current.returnPickupTime &&
        current.returnDropoffTime &&
        current.returnDropoffTime < current.returnPickupTime
      ) {
        nextErrors.returnDropoffTime =
          "Return dropoff time cannot be earlier than return pickup time.";
      }
    }
    if (
      current.tripType === "ONE_WAY" &&
      (current.returnPickupTime || current.returnDropoffTime)
    ) {
      nextErrors.returnPickupTime =
        "Return trip fields must stay empty for one-way recurring schedules.";
    }
    if (
      (current.recurrencePatternType === "WEEKLY" ||
        current.recurrencePatternType === "CUSTOM") &&
      current.daysOfWeek.length === 0 &&
      !current.intervalDays
    ) {
      nextErrors.daysOfWeek =
        "Weekly and custom recurrence patterns require days of week or an interval.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    const normalized = {
      ...form,
      skipDates: parseSkipDates(skipDatesText),
    };
    if (!validate(normalized)) {
      return;
    }
    await onSubmit({
      ...normalized,
      pickupAddressLine1: normalized.pickupAddressLine1.trim(),
      pickupAddressLine2: normalized.pickupAddressLine2?.trim() || null,
      pickupCity: normalized.pickupCity.trim(),
      pickupState: normalized.pickupState.trim(),
      pickupZipCode: normalized.pickupZipCode.trim(),
      pickupCountry: normalized.pickupCountry.trim(),
      dropoffAddressLine1: normalized.dropoffAddressLine1.trim(),
      dropoffAddressLine2: normalized.dropoffAddressLine2?.trim() || null,
      dropoffCity: normalized.dropoffCity.trim(),
      dropoffState: normalized.dropoffState.trim(),
      dropoffZipCode: normalized.dropoffZipCode.trim(),
      dropoffCountry: normalized.dropoffCountry.trim(),
      scheduledDropoffTime: normalized.scheduledDropoffTime || null,
      returnPickupTime:
        normalized.tripType === "ROUND_TRIP"
          ? normalized.returnPickupTime || null
          : null,
      returnDropoffTime:
        normalized.tripType === "ROUND_TRIP"
          ? normalized.returnDropoffTime || null
          : null,
      endDate: normalized.endDate || null,
      intervalDays: normalized.intervalDays || null,
      occurrenceLimit: normalized.occurrenceLimit || null,
      specialInstructions: normalized.specialInstructions?.trim() || null,
      internalNotes: normalized.internalNotes?.trim() || null,
      guardianId: normalized.guardianId ?? null,
      organizationId: normalized.organizationId ?? null,
      contractId: normalized.contractId ?? null,
      serviceAreaId: normalized.serviceAreaId ?? null,
      status: schedule ? null : normalized.status,
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
      <DialogTitle>
        {schedule ? "Update Recurring Schedule" : "Create Recurring Schedule"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {sectionTitle(
            "Rider and Organization Context",
            "Anchor this recurring service to the correct rider, guardian, organization, and contract context.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Rider"
              value={form.riderId ?? ""}
              onChange={(event) => {
                setField("riderId", toNullableNumber(event.target.value));
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
              onChange={(event) =>
                setField("organizationId", toNullableNumber(event.target.value))
              }
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
            {!schedule ? (
              <TextField
                select
                label="Initial Status"
                value={form.status ?? "DRAFT"}
                onChange={(event) =>
                  setField(
                    "status",
                    event.target
                      .value as RecurringRideSchedulePayload["status"],
                  )
                }
                fullWidth
              >
                {recurringRideCreateStatusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Stack>

          {sectionTitle(
            "Recurrence Pattern",
            "Define the service rhythm, active window, and any exception dates for automated generation.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Pattern"
              value={form.recurrencePatternType}
              onChange={(event) =>
                setField(
                  "recurrencePatternType",
                  event.target
                    .value as RecurringRideSchedulePayload["recurrencePatternType"],
                )
              }
              fullWidth
            >
              {recurrencePatternOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.startDate}
              onChange={(event) => setField("startDate", event.target.value)}
              fullWidth
              error={Boolean(errors.startDate)}
              helperText={errors.startDate}
            />
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.endDate ?? ""}
              onChange={(event) => setField("endDate", event.target.value)}
              fullWidth
              error={Boolean(errors.endDate)}
              helperText={errors.endDate}
            />
            <TextField
              label="Occurrence Limit"
              type="number"
              value={form.occurrenceLimit ?? ""}
              onChange={(event) =>
                setField(
                  "occurrenceLimit",
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Custom Interval (Days)"
              type="number"
              value={form.intervalDays ?? ""}
              onChange={(event) =>
                setField(
                  "intervalDays",
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              fullWidth
              inputProps={{ min: 1 }}
              helperText="Optional for custom patterns when using a fixed interval instead of weekdays."
            />
            <TextField
              label="Skip Dates"
              value={skipDatesText}
              onChange={(event) => setSkipDatesText(event.target.value)}
              fullWidth
              helperText="Comma-separated ISO dates such as 2026-04-01, 2026-05-27."
            />
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Days of Week</Typography>
            <FormGroup row>
              {dayOfWeekOptions.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={form.daysOfWeek.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                  }
                  label={day.slice(0, 3)}
                />
              ))}
            </FormGroup>
            {errors.daysOfWeek ? (
              <Typography variant="body2" color="error">
                {errors.daysOfWeek}
              </Typography>
            ) : null}
          </Stack>

          {sectionTitle(
            "Trip Details",
            "Carry forward the recurring trip template that each generated ride instance should inherit.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Service Type"
              value={form.serviceType}
              onChange={(event) =>
                setField(
                  "serviceType",
                  event.target
                    .value as RecurringRideSchedulePayload["serviceType"],
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
              label="Billing Type"
              value={form.billingType ?? ""}
              onChange={(event) =>
                setField(
                  "billingType",
                  (event.target.value ||
                    null) as RecurringRideSchedulePayload["billingType"],
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
              label="Scheduled Pickup Time"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledPickupTime}
              onChange={(event) =>
                setField("scheduledPickupTime", event.target.value)
              }
              fullWidth
              error={Boolean(errors.scheduledPickupTime)}
              helperText={errors.scheduledPickupTime}
            />
            <TextField
              label="Scheduled Dropoff Time"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledDropoffTime ?? ""}
              onChange={(event) =>
                setField("scheduledDropoffTime", event.target.value)
              }
              fullWidth
              error={Boolean(errors.scheduledDropoffTime)}
              helperText={errors.scheduledDropoffTime}
            />
          </Stack>

          {sectionTitle(
            "Pickup Information",
            "Define the recurring pickup template.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Pickup Address Line 1"
              value={form.pickupAddressLine1}
              onChange={(event) =>
                setField("pickupAddressLine1", event.target.value)
              }
              fullWidth
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
            "Define the recurring dropoff template.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Dropoff Address Line 1"
              value={form.dropoffAddressLine1}
              onChange={(event) =>
                setField("dropoffAddressLine1", event.target.value)
              }
              fullWidth
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
            "Round-trip recurring schedules carry a second recurring leg for the return window.",
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Return Pickup Time"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.returnPickupTime ?? ""}
              onChange={(event) =>
                setField("returnPickupTime", event.target.value)
              }
              fullWidth
              disabled={form.tripType !== "ROUND_TRIP"}
              error={Boolean(errors.returnPickupTime)}
              helperText={errors.returnPickupTime}
            />
            <TextField
              label="Return Dropoff Time"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.returnDropoffTime ?? ""}
              onChange={(event) =>
                setField("returnDropoffTime", event.target.value)
              }
              fullWidth
              disabled={form.tripType !== "ROUND_TRIP"}
              error={Boolean(errors.returnDropoffTime)}
              helperText={errors.returnDropoffTime}
            />
          </Stack>

          {sectionTitle(
            "Accessibility and Notes",
            "Preserve recurring support needs and operator-facing guidance on every generated ride instance.",
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
          {loading
            ? "Saving..."
            : schedule
              ? "Update Recurring Schedule"
              : "Create Recurring Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
