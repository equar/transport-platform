import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  ridesApi,
  type RecurringRideSchedulePayload,
  type RecurringRideScheduleRecord,
} from "../api/ridesApi";
import { GenerateRideInstancesDialog } from "../components/GenerateRideInstancesDialog";
import { RecurringRideScheduleDialog } from "../components/RecurringRideScheduleDialog";

type RecurringAction = "activate" | "pause" | "deactivate";

function formatValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}

export function RecurringRideDetailsPage() {
  const { recurrenceId } = useParams();
  const resolvedRecurrenceId = Number(recurrenceId);
  const { showError, showSuccess } = useToast();
  const [schedule, setSchedule] = useState<RecurringRideScheduleRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<RecurringAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  async function loadSchedule() {
    setLoading(true);
    setError(null);
    try {
      const response = await ridesApi.getRecurringById(resolvedRecurrenceId);
      setSchedule(response);
    } catch {
      setError("Recurring ride schedule details could not be loaded.");
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedRecurrenceId) {
      setError("Recurring ride schedule was not found.");
      setLoading(false);
      return;
    }
    void loadSchedule();
  }, [resolvedRecurrenceId]);

  async function handleSubmit(payload: RecurringRideSchedulePayload) {
    if (!schedule) {
      return;
    }
    setSaving(true);
    try {
      await ridesApi.updateRecurring(schedule.id, payload);
      showSuccess("Recurring ride schedule updated successfully.");
      setDialogOpen(false);
      await loadSchedule();
    } catch {
      showError("Recurring ride schedule changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction() {
    if (!schedule || !actionState) {
      return;
    }
    setActionLoading(true);
    try {
      switch (actionState) {
        case "activate":
          await ridesApi.activateRecurring(schedule.id);
          break;
        case "pause":
          await ridesApi.pauseRecurring(schedule.id);
          break;
        case "deactivate":
          await ridesApi.deactivateRecurring(schedule.id);
          break;
      }
      showSuccess("Recurring ride schedule status updated successfully.");
      setActionState(null);
      await loadSchedule();
    } catch {
      showError("The recurring ride schedule action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerate(payload: { fromDate: string; toDate: string }) {
    if (!schedule) {
      return;
    }
    setGenerateLoading(true);
    try {
      const result = await ridesApi.generateRecurring(schedule.id, payload);
      showSuccess(result.summary || "Ride instances generated successfully.");
      setGenerateOpen(false);
      await loadSchedule();
    } catch {
      showError("Ride instances could not be generated.");
    } finally {
      setGenerateLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !schedule) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/recurring-rides"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Recurring Ride Schedules
        </Button>
        <Alert severity="error">
          {error ?? "Recurring ride schedule was not found."}
        </Alert>
      </Stack>
    );
  }

  const actionCopy: Record<
    RecurringAction,
    { title: string; description: string; label: string }
  > = {
    activate: {
      title: "Activate Recurring Schedule",
      description:
        "Enable this recurring schedule so it can participate in future ride generation windows.",
      label: "Activate Schedule",
    },
    pause: {
      title: "Pause Recurring Schedule",
      description:
        "Temporarily stop future generation while preserving this recurring service template.",
      label: "Pause Schedule",
    },
    deactivate: {
      title: "Deactivate Recurring Schedule",
      description:
        "Remove this recurring schedule from future generation while preserving history and audit context.",
      label: "Deactivate Schedule",
    },
  };

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/recurring-rides"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Recurring Ride Schedules
      </Button>

      <SectionHeader
        eyebrow="Company Operations"
        title="Recurring Ride Schedule Details"
        description="Review cadence rules, ride template details, and generation readiness for this recurring service configuration."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Update Schedule
          </Button>
          <Button
            variant="contained"
            startIcon={<PublishRoundedIcon />}
            onClick={() => setGenerateOpen(true)}
          >
            Generate Ride Instances
          </Button>
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            Schedule Summary
          </Typography>
          <Typography variant="h3">{schedule.recurrenceCode}</Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <StatusChip value={schedule.status} />
            <StatusChip value={schedule.recurrencePatternType} />
            <StatusChip value={schedule.serviceType} />
            <StatusChip value={schedule.tripType} />
            {schedule.billingType ? (
              <StatusChip value={schedule.billingType} />
            ) : null}
            <Chip
              label={`${schedule.generatedRideCount} generated rides`}
              color="secondary"
              variant="outlined"
            />
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {schedule.status === "DRAFT" || schedule.status === "PAUSED" ? (
              <Button
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => setActionState("activate")}
              >
                Activate Schedule
              </Button>
            ) : null}
            {schedule.status === "ACTIVE" ? (
              <Button
                startIcon={<PauseCircleRoundedIcon />}
                onClick={() => setActionState("pause")}
              >
                Pause Schedule
              </Button>
            ) : null}
            {!["INACTIVE", "COMPLETED"].includes(schedule.status) ? (
              <Button
                color="error"
                startIcon={<PowerSettingsNewRoundedIcon />}
                onClick={() => setActionState("deactivate")}
              >
                Deactivate Schedule
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </PageCard>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Rider and Service Context</Typography>
            <DetailField
              label="Rider"
              value={`${schedule.riderName} (${schedule.riderCode})`}
            />
            <DetailField
              label="Guardian"
              value={formatValue(schedule.guardianName)}
            />
            <DetailField
              label="Organization"
              value={formatValue(schedule.organizationName)}
            />
            <DetailField
              label="Contract"
              value={formatValue(schedule.contractName)}
            />
            <DetailField
              label="Service Area"
              value={formatValue(schedule.serviceAreaName)}
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Cadence and Generation Rules</Typography>
            <DetailField label="Start Date" value={schedule.startDate} />
            <DetailField
              label="End Date"
              value={formatValue(schedule.endDate)}
            />
            <DetailField
              label="Occurrence Limit"
              value={
                schedule.occurrenceLimit
                  ? String(schedule.occurrenceLimit)
                  : "-"
              }
            />
            <DetailField
              label="Interval Days"
              value={
                schedule.intervalDays ? String(schedule.intervalDays) : "-"
              }
            />
            <DetailField
              label="Days of Week"
              value={
                schedule.daysOfWeek.length > 0
                  ? schedule.daysOfWeek.join(", ")
                  : "-"
              }
            />
            <DetailField
              label="Skip Dates"
              value={
                schedule.skipDates.length > 0
                  ? schedule.skipDates.join(", ")
                  : "-"
              }
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Trip Timing</Typography>
            <DetailField
              label="Scheduled Pickup Time"
              value={schedule.scheduledPickupTime.slice(0, 5)}
            />
            <DetailField
              label="Scheduled Dropoff Time"
              value={formatValue(schedule.scheduledDropoffTime?.slice(0, 5))}
            />
            <DetailField
              label="Return Pickup Time"
              value={formatValue(schedule.returnPickupTime?.slice(0, 5))}
            />
            <DetailField
              label="Return Dropoff Time"
              value={formatValue(schedule.returnDropoffTime?.slice(0, 5))}
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Route Template</Typography>
            <Typography color="text.secondary">
              {[
                schedule.pickupAddressLine1,
                schedule.pickupAddressLine2,
                `${schedule.pickupCity}, ${schedule.pickupState} ${schedule.pickupZipCode}`,
                schedule.pickupCountry,
              ]
                .filter(Boolean)
                .join("\n")}
            </Typography>
            <Typography color="text.secondary">
              {[
                schedule.dropoffAddressLine1,
                schedule.dropoffAddressLine2,
                `${schedule.dropoffCity}, ${schedule.dropoffState} ${schedule.dropoffZipCode}`,
                schedule.dropoffCountry,
              ]
                .filter(Boolean)
                .join("\n")}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Accessibility and Notes</Typography>
            <DetailField
              label="Wheelchair Required"
              value={schedule.wheelchairRequired ? "Yes" : "No"}
            />
            <DetailField
              label="Escort Required"
              value={schedule.escortRequired ? "Yes" : "No"}
            />
            <DetailField
              label="Companion Count"
              value={String(schedule.companionCount)}
            />
            <DetailField
              label="Special Instructions"
              value={formatValue(schedule.specialInstructions)}
            />
            <DetailField
              label="Internal Notes"
              value={formatValue(schedule.internalNotes)}
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Audit</Typography>
            <DetailField
              label="Created By"
              value={`${schedule.createdBy} · ${formatDateTime(schedule.createdAt)}`}
            />
            <DetailField
              label="Updated By"
              value={`${schedule.updatedBy} · ${formatDateTime(schedule.updatedAt)}`}
            />
          </Stack>
        </PageCard>
      </Box>

      <RecurringRideScheduleDialog
        open={dialogOpen}
        schedule={schedule}
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <GenerateRideInstancesDialog
        open={generateOpen}
        loading={generateLoading}
        recurrenceCode={schedule.recurrenceCode}
        onClose={() => setGenerateOpen(false)}
        onSubmit={handleGenerate}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={actionState ? actionCopy[actionState].title : "Recurring Action"}
        description={actionState ? actionCopy[actionState].description : ""}
        confirmLabel={actionState ? actionCopy[actionState].label : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleAction()}
      />
    </Stack>
  );
}
