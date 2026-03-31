import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import { ridesApi, type RidePayload, type RideRecord } from "../api/ridesApi";
import { RideCancellationDialog } from "../components/RideCancellationDialog";
import { RideUpsertDialog } from "../components/RideUpsertDialog";

type RideAction = "request" | "review" | "schedule";

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

export function RideDetailsPage() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const resolvedRideId = Number(rideId);
  const { showError, showSuccess } = useToast();
  const [ride, setRide] = useState<RideRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<RideAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function loadRide() {
    setLoading(true);
    setError(null);
    try {
      const response = await ridesApi.getById(resolvedRideId);
      setRide(response);
    } catch {
      setError("Ride details could not be loaded.");
      setRide(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedRideId) {
      setError("Ride was not found.");
      setLoading(false);
      return;
    }
    void loadRide();
  }, [resolvedRideId]);

  async function handleSubmit(payload: RidePayload) {
    if (!ride) {
      return;
    }
    setSaving(true);
    try {
      await ridesApi.update(ride.id, payload);
      showSuccess("Ride updated successfully.");
      setDialogOpen(false);
      await loadRide();
    } catch {
      showError("Ride changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction() {
    if (!ride || !actionState) {
      return;
    }
    setActionLoading(true);
    try {
      switch (actionState) {
        case "request":
          await ridesApi.request(ride.id);
          break;
        case "review":
          await ridesApi.review(ride.id);
          break;
        case "schedule":
          await ridesApi.schedule(ride.id);
          break;
      }
      showSuccess("Ride status updated successfully.");
      setActionState(null);
      await loadRide();
    } catch {
      showError("The ride action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(reason: string) {
    if (!ride) {
      return;
    }
    setCancelLoading(true);
    try {
      await ridesApi.cancel(ride.id, reason);
      showSuccess("Ride cancelled successfully.");
      setCancelOpen(false);
      await loadRide();
    } catch {
      showError("The ride could not be cancelled.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !ride) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/rides"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Ride Management
        </Button>
        <Alert severity="error">{error ?? "Ride was not found."}</Alert>
      </Stack>
    );
  }

  const actionCopy: Record<
    RideAction,
    { title: string; description: string; label: string }
  > = {
    request: {
      title: "Submit Ride Request",
      description:
        "Move this ride into the request queue so it can continue through review and scheduling.",
      label: "Submit Request",
    },
    review: {
      title: "Move Ride to Review",
      description:
        "Flag this ride for review so operations can verify the trip details and references.",
      label: "Move to Review",
    },
    schedule: {
      title: "Schedule Ride",
      description:
        "Mark this ride as scheduled to preserve a clean lifecycle signal for downstream operational workflows.",
      label: "Schedule Ride",
    },
  };

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/rides"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Ride Management
      </Button>

      <SectionHeader
        eyebrow="Company Operations"
        title="Ride Details"
        description="Review lifecycle state, rider context, trip timing, and operational notes for this ride record."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Update Ride
          </Button>
          {ride.recurrenceScheduleId ? (
            <Button
              variant="outlined"
              startIcon={<LinkRoundedIcon />}
              onClick={() =>
                navigate(
                  `/company/recurring-rides/${ride.recurrenceScheduleId}`,
                )
              }
            >
              View Recurring Schedule
            </Button>
          ) : null}
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            Ride Summary
          </Typography>
          <Typography variant="h3">{ride.rideNumber}</Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <StatusChip value={ride.status} />
            <StatusChip value={ride.serviceType} />
            <StatusChip value={ride.tripType} />
            {ride.priorityLevel ? (
              <StatusChip value={ride.priorityLevel} />
            ) : null}
            {ride.billingType ? <StatusChip value={ride.billingType} /> : null}
            {ride.recurrenceCode ? (
              <Chip
                label={ride.recurrenceCode}
                color="secondary"
                variant="outlined"
              />
            ) : null}
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {ride.status === "DRAFT" ? (
              <Button
                startIcon={<AssignmentTurnedInRoundedIcon />}
                onClick={() => setActionState("request")}
              >
                Submit Request
              </Button>
            ) : null}
            {ride.status === "DRAFT" || ride.status === "REQUESTED" ? (
              <Button
                startIcon={<RateReviewRoundedIcon />}
                onClick={() => setActionState("review")}
              >
                Move to Review
              </Button>
            ) : null}
            {ride.status === "DRAFT" || ride.status === "PENDING_REVIEW" ? (
              <Button
                startIcon={<CalendarMonthRoundedIcon />}
                onClick={() => setActionState("schedule")}
              >
                Schedule Ride
              </Button>
            ) : null}
            {!["CANCELLED", "COMPLETED", "FAILED"].includes(ride.status) ? (
              <Button
                startIcon={<CancelRoundedIcon />}
                color="error"
                onClick={() => setCancelOpen(true)}
              >
                Cancel Ride
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
              value={`${ride.riderName} (${ride.riderCode})`}
            />
            <DetailField
              label="Guardian"
              value={formatValue(ride.guardianName)}
            />
            <DetailField
              label="Organization"
              value={formatValue(ride.organizationName)}
            />
            <DetailField
              label="Contract"
              value={formatValue(ride.contractName)}
            />
            <DetailField
              label="Service Area"
              value={formatValue(ride.serviceAreaName)}
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Schedule and Routing</Typography>
            <DetailField
              label="Scheduled Pickup"
              value={formatDateTime(ride.scheduledPickupAt)}
            />
            <DetailField
              label="Scheduled Dropoff"
              value={formatValue(
                ride.scheduledDropoffAt
                  ? formatDateTime(ride.scheduledDropoffAt)
                  : "-",
              )}
            />
            <DetailField
              label="Return Pickup"
              value={formatValue(
                ride.returnPickupAt ? formatDateTime(ride.returnPickupAt) : "-",
              )}
            />
            <DetailField
              label="Return Dropoff"
              value={formatValue(
                ride.returnDropoffAt
                  ? formatDateTime(ride.returnDropoffAt)
                  : "-",
              )}
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Pickup Location</Typography>
            <Typography color="text.secondary">
              {[
                ride.pickupAddressLine1,
                ride.pickupAddressLine2,
                `${ride.pickupCity}, ${ride.pickupState} ${ride.pickupZipCode}`,
                ride.pickupCountry,
              ]
                .filter(Boolean)
                .join("\n")}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Dropoff Location</Typography>
            <Typography color="text.secondary">
              {[
                ride.dropoffAddressLine1,
                ride.dropoffAddressLine2,
                `${ride.dropoffCity}, ${ride.dropoffState} ${ride.dropoffZipCode}`,
                ride.dropoffCountry,
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
              value={ride.wheelchairRequired ? "Yes" : "No"}
            />
            <DetailField
              label="Escort Required"
              value={ride.escortRequired ? "Yes" : "No"}
            />
            <DetailField
              label="Companion Count"
              value={String(ride.companionCount)}
            />
            <DetailField
              label="Special Instructions"
              value={formatValue(ride.specialInstructions)}
            />
            <DetailField
              label="Internal Notes"
              value={formatValue(ride.internalNotes)}
            />
            <DetailField
              label="Operational Notes"
              value={formatValue(ride.operationalNotes)}
            />
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Audit and Lifecycle</Typography>
            <DetailField
              label="Created By"
              value={`${ride.createdBy} · ${formatDateTime(ride.createdAt)}`}
            />
            <DetailField
              label="Updated By"
              value={`${ride.updatedBy} · ${formatDateTime(ride.updatedAt)}`}
            />
            <DetailField
              label="Cancelled By"
              value={formatValue(ride.cancelledBy)}
            />
            <DetailField
              label="Cancelled At"
              value={formatValue(
                ride.cancelledAt ? formatDateTime(ride.cancelledAt) : "-",
              )}
            />
            <DetailField
              label="Cancellation Reason"
              value={formatValue(ride.cancellationReason)}
            />
          </Stack>
        </PageCard>
      </Box>

      <RideUpsertDialog
        open={dialogOpen}
        ride={ride}
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <RideCancellationDialog
        open={cancelOpen}
        loading={cancelLoading}
        rideLabel={ride.rideNumber}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={actionState ? actionCopy[actionState].title : "Ride Action"}
        description={actionState ? actionCopy[actionState].description : ""}
        confirmLabel={actionState ? actionCopy[actionState].label : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleAction()}
      />
    </Stack>
  );
}
