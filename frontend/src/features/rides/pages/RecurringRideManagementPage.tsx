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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
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
import {
  recurrencePatternOptions,
  recurringRideStatusOptions,
  ridesApi,
  rideTripTypeOptions,
  serviceTypeOptions,
  type RecurringRideSchedulePayload,
  type RecurringRideScheduleRecord,
  type RecurringRideSearchParams,
  type RideRecurrencePatternType,
  type RideRecurrenceStatus,
  type RideTripType,
  type ServiceType,
} from "../api/ridesApi";
import { GenerateRideInstancesDialog } from "../components/GenerateRideInstancesDialog";
import { RecurringRideScheduleDialog } from "../components/RecurringRideScheduleDialog";

type RecurringAction = "activate" | "pause" | "deactivate";

function defaultFilters(): RecurringRideSearchParams {
  return {
    keyword: "",
    status: "",
    serviceType: "",
    tripType: "",
    recurrencePatternType: "",
    riderId: null,
    organizationId: null,
    contractId: null,
    fromDate: "",
    toDate: "",
    page: 0,
    size: 10,
    sortBy: "updatedAt",
    sortDirection: "DESC",
  };
}

export function RecurringRideManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [filters, setFilters] =
    useState<RecurringRideSearchParams>(defaultFilters());
  const [items, setItems] = useState<RecurringRideScheduleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<RecurringRideScheduleRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: RecurringAction;
    schedule: RecurringRideScheduleRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generateState, setGenerateState] =
    useState<RecurringRideScheduleRecord | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);

  async function loadSchedules() {
    setLoading(true);
    setError(null);
    try {
      const response = await ridesApi.searchRecurring(filters);
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Recurring ride schedules could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, [filters]);

  function updateFilters<K extends keyof RecurringRideSearchParams>(
    field: K,
    value: RecurringRideSearchParams[K],
  ) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? Number(value) : 0,
      [field]: value,
    }));
  }

  async function handleSubmit(payload: RecurringRideSchedulePayload) {
    setSaving(true);
    try {
      if (selectedSchedule) {
        await ridesApi.updateRecurring(selectedSchedule.id, payload);
        showSuccess("Recurring ride schedule updated successfully.");
      } else {
        await ridesApi.createRecurring(payload);
        showSuccess("Recurring ride schedule created successfully.");
      }
      setDialogOpen(false);
      setSelectedSchedule(null);
      await loadSchedules();
    } catch {
      showError("Recurring ride schedule changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction() {
    if (!actionState) {
      return;
    }
    setActionLoading(true);
    try {
      switch (actionState.type) {
        case "activate":
          await ridesApi.activateRecurring(actionState.schedule.id);
          break;
        case "pause":
          await ridesApi.pauseRecurring(actionState.schedule.id);
          break;
        case "deactivate":
          await ridesApi.deactivateRecurring(actionState.schedule.id);
          break;
      }
      showSuccess("Recurring ride schedule status updated successfully.");
      setActionState(null);
      await loadSchedules();
    } catch {
      showError("The recurring ride schedule action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerate(payload: { fromDate: string; toDate: string }) {
    if (!generateState) {
      return;
    }
    setGenerateLoading(true);
    try {
      const result = await ridesApi.generateRecurring(
        generateState.id,
        payload,
      );
      showSuccess(result.summary || "Ride instances generated successfully.");
      setGenerateState(null);
      await loadSchedules();
    } catch {
      showError("Ride instances could not be generated.");
    } finally {
      setGenerateLoading(false);
    }
  }

  function renderActions(schedule: RecurringRideScheduleRecord) {
    return (
      <>
        <TableActionButton
          title="View Details"
          onClick={() => navigate(`/company/recurring-rides/${schedule.id}`)}
        >
          <VisibilityRoundedIcon />
        </TableActionButton>
        {!["INACTIVE", "COMPLETED"].includes(schedule.status) ? (
          <TableActionButton
            title="Edit Schedule"
            onClick={() => {
              setSelectedSchedule(schedule);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
        ) : null}
        {schedule.status === "DRAFT" || schedule.status === "PAUSED" ? (
          <TableActionButton
            title="Activate Schedule"
            onClick={() => setActionState({ type: "activate", schedule })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
        ) : null}
        {schedule.status === "ACTIVE" ? (
          <TableActionButton
            title="Pause Schedule"
            onClick={() => setActionState({ type: "pause", schedule })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        ) : null}
        {!["INACTIVE", "COMPLETED"].includes(schedule.status) ? (
          <TableActionButton
            title="Deactivate Schedule"
            onClick={() => setActionState({ type: "deactivate", schedule })}
          >
            <PowerSettingsNewRoundedIcon />
          </TableActionButton>
        ) : null}
        <TableActionButton
          title="Generate Ride Instances"
          onClick={() => setGenerateState(schedule)}
        >
          <PublishRoundedIcon />
        </TableActionButton>
      </>
    );
  }

  const actionCopy: Record<
    RecurringAction,
    { title: string; description: string; label: string }
  > = {
    activate: {
      title: "Activate Recurring Schedule",
      description:
        "Enable this recurring schedule so it can participate in upcoming ride generation windows.",
      label: "Activate Schedule",
    },
    pause: {
      title: "Pause Recurring Schedule",
      description:
        "Temporarily stop future generation without removing the recurring schedule configuration.",
      label: "Pause Schedule",
    },
    deactivate: {
      title: "Deactivate Recurring Schedule",
      description:
        "Permanently remove this schedule from future generation workflows while preserving history.",
      label: "Deactivate Schedule",
    },
  };

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Operations"
        title="Recurring Ride Schedules"
        description="Manage recurring service templates, cadence rules, and controlled ride generation windows for repeat transportation needs."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedSchedule(null);
            setDialogOpen(true);
          }}
        >
          Create Recurring Schedule
        </Button>
      </SectionHeader>

      <AdminFilterBar stackProps={{ alignItems: { md: "center" } }}>
        <TextField
          label="Search"
          placeholder="Recurrence code, rider, contract, or location"
          value={filters.keyword}
          onChange={(event) => updateFilters("keyword", event.target.value)}
        />
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(event) =>
            updateFilters(
              "status",
              event.target.value as RideRecurrenceStatus | "",
            )
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {recurringRideStatusOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Pattern"
          value={filters.recurrencePatternType}
          onChange={(event) =>
            updateFilters(
              "recurrencePatternType",
              event.target.value as RideRecurrencePatternType | "",
            )
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All patterns</MenuItem>
          {recurrencePatternOptions.map((value) => (
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
          title="No recurring ride schedules found"
          description="Create a recurring schedule to automate ride generation for repeat transportation patterns."
        />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 5, overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Schedule</TableCell>
                <TableCell>Rider</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Generated Rides</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((schedule) => (
                <TableRow key={schedule.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {schedule.recurrenceCode}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Starts {schedule.startDate}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {schedule.riderName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {schedule.organizationName ?? "No organization"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75}>
                      <StatusChip value={schedule.recurrencePatternType} />
                      <Chip
                        label={
                          schedule.daysOfWeek.length > 0
                            ? schedule.daysOfWeek
                                .map((day) => day.slice(0, 3))
                                .join(", ")
                            : `${schedule.intervalDays ?? "-"} day interval`
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75}>
                      <StatusChip value={schedule.serviceType} />
                      <StatusChip value={schedule.tripType} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <StatusChip value={schedule.status} />
                  </TableCell>
                  <TableCell>{schedule.generatedRideCount}</TableCell>
                  <TableCell align="right">{renderActions(schedule)}</TableCell>
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

      <RecurringRideScheduleDialog
        open={dialogOpen}
        schedule={selectedSchedule}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedSchedule(null);
        }}
        onSubmit={handleSubmit}
      />

      <GenerateRideInstancesDialog
        open={Boolean(generateState)}
        loading={generateLoading}
        recurrenceCode={generateState?.recurrenceCode ?? ""}
        onClose={() => setGenerateState(null)}
        onSubmit={handleGenerate}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={
          actionState ? actionCopy[actionState.type].title : "Recurring Action"
        }
        description={
          actionState ? actionCopy[actionState.type].description : ""
        }
        confirmLabel={
          actionState ? actionCopy[actionState.type].label : "Confirm"
        }
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleAction()}
      />
    </Stack>
  );
}
