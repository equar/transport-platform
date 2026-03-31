import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  incidentSeverityOptions,
  incidentStatusOptions,
  incidentTypeOptions,
  type IncidentDetailRecord,
  type IncidentPayload,
  type IncidentReferenceData,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentType,
} from "../api/incidentsApi";

interface IncidentUpsertDialogProps {
  open: boolean;
  incident: IncidentDetailRecord | null;
  referenceData: IncidentReferenceData | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: IncidentPayload) => Promise<void>;
}

interface IncidentFormState {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus | "";
  title: string;
  description: string;
  reportedAt: string;
  reportedByNameSnapshot: string;
  assignedToUserId: string;
  relatedRideId: string;
  relatedDriverId: string;
  relatedVehicleId: string;
  relatedRiderId: string;
  relatedGuardianId: string;
  relatedOrganizationId: string;
  resolutionSummary: string;
  rootCauseSummary: string;
  correctiveActionSummary: string;
  notes: string;
}

function emptyForm(): IncidentFormState {
  return {
    incidentType: "SAFETY_INCIDENT",
    severity: "MEDIUM",
    status: "",
    title: "",
    description: "",
    reportedAt: "",
    reportedByNameSnapshot: "",
    assignedToUserId: "",
    relatedRideId: "",
    relatedDriverId: "",
    relatedVehicleId: "",
    relatedRiderId: "",
    relatedGuardianId: "",
    relatedOrganizationId: "",
    resolutionSummary: "",
    rootCauseSummary: "",
    correctiveActionSummary: "",
    notes: "",
  };
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function toOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  return Number(value);
}

function buildPayload(form: IncidentFormState): IncidentPayload {
  return {
    incidentType: form.incidentType,
    severity: form.severity,
    status: form.status || undefined,
    title: form.title,
    description: form.description,
    reportedAt: form.reportedAt || undefined,
    reportedByNameSnapshot: form.reportedByNameSnapshot,
    assignedToUserId: toOptionalNumber(form.assignedToUserId),
    relatedRideId: toOptionalNumber(form.relatedRideId),
    relatedDriverId: toOptionalNumber(form.relatedDriverId),
    relatedVehicleId: toOptionalNumber(form.relatedVehicleId),
    relatedRiderId: toOptionalNumber(form.relatedRiderId),
    relatedGuardianId: toOptionalNumber(form.relatedGuardianId),
    relatedOrganizationId: toOptionalNumber(form.relatedOrganizationId),
    resolutionSummary: form.resolutionSummary,
    rootCauseSummary: form.rootCauseSummary,
    correctiveActionSummary: form.correctiveActionSummary,
    notes: form.notes,
  };
}

function fromIncident(incident: IncidentDetailRecord): IncidentFormState {
  return {
    incidentType: incident.incidentType,
    severity: incident.severity,
    status: incident.status,
    title: incident.title,
    description: incident.description,
    reportedAt: formatDateTimeLocal(incident.reportedAt),
    reportedByNameSnapshot: incident.reportedByNameSnapshot ?? "",
    assignedToUserId: incident.assignedToUserId
      ? String(incident.assignedToUserId)
      : "",
    relatedRideId: incident.relatedRideId ? String(incident.relatedRideId) : "",
    relatedDriverId: incident.relatedDriverId
      ? String(incident.relatedDriverId)
      : "",
    relatedVehicleId: incident.relatedVehicleId
      ? String(incident.relatedVehicleId)
      : "",
    relatedRiderId: incident.relatedRiderId
      ? String(incident.relatedRiderId)
      : "",
    relatedGuardianId: incident.relatedGuardianId
      ? String(incident.relatedGuardianId)
      : "",
    relatedOrganizationId: incident.relatedOrganizationId
      ? String(incident.relatedOrganizationId)
      : "",
    resolutionSummary: incident.resolutionSummary ?? "",
    rootCauseSummary: incident.rootCauseSummary ?? "",
    correctiveActionSummary: incident.correctiveActionSummary ?? "",
    notes: incident.notes ?? "",
  };
}

export function IncidentUpsertDialog({
  open,
  incident,
  referenceData,
  loading,
  onClose,
  onSubmit,
}: IncidentUpsertDialogProps) {
  const [form, setForm] = useState<IncidentFormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    setForm(incident ? fromIncident(incident) : emptyForm());
  }, [incident, open]);

  function setValue<K extends keyof IncidentFormState>(
    key: K,
    value: IncidentFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!form.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(buildPayload(form));
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {incident ? "Update Incident" : "Create Incident"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Type"
              value={form.incidentType}
              onChange={(event) =>
                setValue("incidentType", event.target.value as IncidentType)
              }
              fullWidth
            >
              {incidentTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Severity"
              value={form.severity}
              onChange={(event) =>
                setValue("severity", event.target.value as IncidentSeverity)
              }
              fullWidth
            >
              {incidentSeverityOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(event) =>
                setValue("status", event.target.value as IncidentStatus | "")
              }
              fullWidth
            >
              <MenuItem value="">Default workflow state</MenuItem>
              {incidentStatusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            label="Title"
            value={form.title}
            onChange={(event) => setValue("title", event.target.value)}
            error={Boolean(errors.title)}
            helperText={errors.title}
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => setValue("description", event.target.value)}
            error={Boolean(errors.description)}
            helperText={errors.description}
            fullWidth
            minRows={4}
            multiline
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Reported At"
              type="datetime-local"
              value={form.reportedAt}
              onChange={(event) => setValue("reportedAt", event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Reported By Snapshot"
              value={form.reportedByNameSnapshot}
              onChange={(event) =>
                setValue("reportedByNameSnapshot", event.target.value)
              }
              fullWidth
            />
            <TextField
              select
              label="Assigned To"
              value={form.assignedToUserId}
              onChange={(event) =>
                setValue("assignedToUserId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">Unassigned</MenuItem>
              {(referenceData?.users ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Related Ride"
              value={form.relatedRideId}
              onChange={(event) =>
                setValue("relatedRideId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {(referenceData?.rides ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Related Driver"
              value={form.relatedDriverId}
              onChange={(event) =>
                setValue("relatedDriverId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {(referenceData?.drivers ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Related Vehicle"
              value={form.relatedVehicleId}
              onChange={(event) =>
                setValue("relatedVehicleId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {(referenceData?.vehicles ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Related Rider"
              value={form.relatedRiderId}
              onChange={(event) =>
                setValue("relatedRiderId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {(referenceData?.riders ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Related Guardian"
              value={form.relatedGuardianId}
              onChange={(event) =>
                setValue("relatedGuardianId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {(referenceData?.guardians ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Related Organization"
              value={form.relatedOrganizationId}
              onChange={(event) =>
                setValue("relatedOrganizationId", event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {(referenceData?.organizations ?? []).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            label="Resolution Summary"
            value={form.resolutionSummary}
            onChange={(event) =>
              setValue("resolutionSummary", event.target.value)
            }
            fullWidth
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Root Cause Summary"
              value={form.rootCauseSummary}
              onChange={(event) =>
                setValue("rootCauseSummary", event.target.value)
              }
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Corrective Action Summary"
              value={form.correctiveActionSummary}
              onChange={(event) =>
                setValue("correctiveActionSummary", event.target.value)
              }
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(event) => setValue("notes", event.target.value)}
            fullWidth
            multiline
            minRows={3}
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
            : incident
              ? "Update Incident"
              : "Create Incident"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
