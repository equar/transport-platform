import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  rideStatusOptions,
  ridesApi,
  rideTripTypeOptions,
  serviceTypeOptions,
  type RidePayload,
  type RideRecord,
  type RideSearchParams,
  type RideStatus,
  type RideTripType,
  type ServiceType,
} from "../api/ridesApi";
import { RideCancellationDialog } from "../components/RideCancellationDialog";
import { RideUpsertDialog } from "../components/RideUpsertDialog";

type RideAction = "request" | "review" | "schedule";

function defaultFilters(): RideSearchParams {
  return {
    keyword: "",
    status: "",
    serviceType: "",
    tripType: "",
    riderId: null,
    organizationId: null,
    contractId: null,
    fromDate: "",
    toDate: "",
    recurringOnly: "",
    page: 0,
    size: 10,
    sortBy: "updatedAt",
    sortDirection: "DESC",
  };
}

export function RideManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [filters, setFilters] = useState<RideSearchParams>(defaultFilters());
  const [items, setItems] = useState<RideRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<RideRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: RideAction;
    ride: RideRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelRide, setCancelRide] = useState<RideRecord | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function loadRides() {
    setLoading(true);
    setError(null);
    try {
      const response = await ridesApi.search(filters);
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Rides could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRides();
  }, [filters]);

  function updateFilters<K extends keyof RideSearchParams>(
    field: K,
    value: RideSearchParams[K],
  ) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? Number(value) : 0,
      [field]: value,
    }));
  }

  async function handleSubmit(payload: RidePayload) {
    setSaving(true);
    try {
      if (selectedRide) {
        await ridesApi.update(selectedRide.id, payload);
        showSuccess("Ride updated successfully.");
      } else {
        await ridesApi.create(payload);
        showSuccess("Ride created successfully.");
      }
      setDialogOpen(false);
      setSelectedRide(null);
      await loadRides();
    } catch {
      showError("Ride changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActionConfirm() {
    if (!actionState) {
      return;
    }
    setActionLoading(true);
    try {
      switch (actionState.type) {
        case "request":
          await ridesApi.request(actionState.ride.id);
          break;
        case "review":
          await ridesApi.review(actionState.ride.id);
          break;
        case "schedule":
          await ridesApi.schedule(actionState.ride.id);
          break;
      }
      showSuccess("Ride status updated successfully.");
      setActionState(null);
      await loadRides();
    } catch {
      showError("The ride action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(reason: string) {
    if (!cancelRide) {
      return;
    }
    setCancelLoading(true);
    try {
      await ridesApi.cancel(cancelRide.id, reason);
      showSuccess("Ride cancelled successfully.");
      setCancelRide(null);
      await loadRides();
    } catch {
      showError("The ride could not be cancelled.");
    } finally {
      setCancelLoading(false);
    }
  }

  function renderActions(ride: RideRecord) {
    return (
      <>
        <TableActionButton
          title="View Details"
          onClick={() => navigate(`/company/rides/${ride.id}`)}
        >
          <VisibilityRoundedIcon />
        </TableActionButton>
        {!["CANCELLED", "COMPLETED", "FAILED"].includes(ride.status) ? (
          <TableActionButton
            title="Edit Ride"
            onClick={() => {
              setSelectedRide(ride);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
        ) : null}
        {ride.status === "DRAFT" || ride.status === "REQUESTED" ? (
          <TableActionButton
            title="Move to Review"
            onClick={() => setActionState({ type: "review", ride })}
          >
            <RateReviewRoundedIcon />
          </TableActionButton>
        ) : null}
        {ride.status === "DRAFT" || ride.status === "PENDING_REVIEW" ? (
          <TableActionButton
            title="Schedule Ride"
            onClick={() => setActionState({ type: "schedule", ride })}
          >
            <CalendarMonthRoundedIcon />
          </TableActionButton>
        ) : null}
        {ride.status === "DRAFT" ? (
          <TableActionButton
            title="Submit Request"
            onClick={() => setActionState({ type: "request", ride })}
          >
            <AssignmentTurnedInRoundedIcon />
          </TableActionButton>
        ) : null}
        {!["CANCELLED", "COMPLETED", "FAILED"].includes(ride.status) ? (
          <TableActionButton
            title="Cancel Ride"
            onClick={() => setCancelRide(ride)}
          >
            <CancelRoundedIcon />
          </TableActionButton>
        ) : null}
      </>
    );
  }

  function actionCopy(type: RideAction) {
    switch (type) {
      case "request":
        return {
          title: "Submit Ride Request",
          description:
            "Move this ride into the request queue so it can enter downstream review and scheduling workflows.",
          label: "Submit Request",
        };
      case "review":
        return {
          title: "Mark Ride Ready for Review",
          description:
            "Move this ride into review so operations can confirm references and trip readiness before scheduling.",
          label: "Move to Review",
        };
      case "schedule":
        return {
          title: "Schedule Ride",
          description:
            "Mark this ride as scheduled. This preserves a clean lifecycle signal ahead of future dispatch and assignment workflows.",
          label: "Schedule Ride",
        };
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Operations"
        title="Ride Management"
        description="Manage one-off and recurring-generated rides with lifecycle controls, scheduling context, and operational notes from a single company-admin workspace."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => navigate("/company/dispatch")}
          >
            Open Dispatch Board
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/company/routes")}
          >
            Manage Routes
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setSelectedRide(null);
              setDialogOpen(true);
            }}
          >
            Create Ride
          </Button>
        </Stack>
      </SectionHeader>

      <AdminFilterBar stackProps={{ alignItems: { md: "center" } }}>
        <TextField
          label="Search"
          placeholder="Ride number, rider, contract, or location"
          value={filters.keyword}
          onChange={(event) => updateFilters("keyword", event.target.value)}
        />
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(event) =>
            updateFilters("status", event.target.value as RideStatus | "")
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {rideStatusOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Service Type"
          value={filters.serviceType}
          onChange={(event) =>
            updateFilters("serviceType", event.target.value as ServiceType | "")
          }
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All service types</MenuItem>
          {serviceTypeOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Trip Type"
          value={filters.tripType}
          onChange={(event) =>
            updateFilters("tripType", event.target.value as RideTripType | "")
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All trip types</MenuItem>
          {rideTripTypeOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Recurring"
          value={filters.recurringOnly}
          onChange={(event) =>
            updateFilters(
              "recurringOnly",
              event.target.value as RideSearchParams["recurringOnly"],
            )
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All rides</MenuItem>
          <MenuItem value="true">Recurring only</MenuItem>
          <MenuItem value="false">One-off only</MenuItem>
        </TextField>
        <TextField
          label="From Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.fromDate}
          onChange={(event) => updateFilters("fromDate", event.target.value)}
        />
        <TextField
          label="To Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.toDate}
          onChange={(event) => updateFilters("toDate", event.target.value)}
        />
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="No rides found"
          description="Adjust the filters or create a ride to start building operational scheduling history for this tenant."
        />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 5, overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ride</TableCell>
                <TableCell>Rider</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Recurring</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ride.rideNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ride.organizationName ?? "No organization"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{ride.riderName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ride.guardianName ?? "No guardian"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75}>
                      <StatusChip value={ride.serviceType} />
                      <StatusChip value={ride.tripType} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {formatDateTime(ride.scheduledPickupAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ride.pickupCity} to {ride.dropoffCity}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <StatusChip value={ride.status} />
                  </TableCell>
                  <TableCell>
                    {ride.recurrenceCode ? (
                      <Chip
                        label={ride.recurrenceCode}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        One-off
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{renderActions(ride)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={filters.page}
            onPageChange={(_, nextPage) => updateFilters("page", nextPage)}
            rowsPerPage={filters.size}
            onRowsPerPageChange={(event) => {
              setFilters((current) => ({
                ...current,
                page: 0,
                size: Number(event.target.value),
              }));
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>
      )}

      <RideUpsertDialog
        open={dialogOpen}
        ride={selectedRide}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedRide(null);
        }}
        onSubmit={handleSubmit}
      />

      <RideCancellationDialog
        open={Boolean(cancelRide)}
        loading={cancelLoading}
        rideLabel={cancelRide?.rideNumber ?? "this ride"}
        onClose={() => setCancelRide(null)}
        onSubmit={handleCancel}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={actionState ? actionCopy(actionState.type).title : "Ride Action"}
        description={
          actionState ? actionCopy(actionState.type).description : ""
        }
        confirmLabel={
          actionState ? actionCopy(actionState.type).label : "Confirm"
        }
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleActionConfirm()}
      />
    </Stack>
  );
}
