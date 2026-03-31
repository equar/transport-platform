import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  dispatchApi,
  dispatchViewOptions,
  type DispatchRideRecord,
  type DispatchSearchParams,
  type LookupOption,
} from "../api/dispatchApi";
import {
  serviceTypeOptions,
  rideStatusOptions,
  type RideStatus,
  type ServiceType,
} from "../../rides/api/ridesApi";

function defaultFilters(): DispatchSearchParams {
  return {
    keyword: "",
    view: "ALL",
    status: "",
    serviceType: "",
    driverId: null,
    vehicleId: null,
    organizationId: null,
    fromDate: "",
    toDate: "",
    page: 0,
    size: 10,
    sortBy: "scheduledPickupAt",
    sortDirection: "ASC",
  };
}

export function DispatchBoardPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [filters, setFilters] =
    useState<DispatchSearchParams>(defaultFilters());
  const [items, setItems] = useState<DispatchRideRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    scheduledCount: 0,
    assignedCount: 0,
    inProgressCount: 0,
    exceptionCount: 0,
    completedTodayCount: 0,
    noShowTodayCount: 0,
  });
  const [driverOptions, setDriverOptions] = useState<LookupOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogRide, setDialogRide] = useState<DispatchRideRecord | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | "">("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  async function loadBoard() {
    setLoading(true);
    setError(null);
    try {
      const [pageResponse, summaryResponse, drivers, vehicles] =
        await Promise.all([
          dispatchApi.search(filters),
          dispatchApi.getSummary(filters),
          dispatchApi.listDriverOptions(),
          dispatchApi.listVehicleOptions(),
        ]);
      setItems(pageResponse.items);
      setTotal(pageResponse.totalElements);
      setSummary(summaryResponse);
      setDriverOptions(drivers);
      setVehicleOptions(vehicles);
    } catch {
      setError("Dispatch board data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBoard();
  }, [filters]);

  function updateFilters<K extends keyof DispatchSearchParams>(
    field: K,
    value: DispatchSearchParams[K],
  ) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? Number(value) : 0,
      [field]: value,
    }));
  }

  async function handleAssignmentSave() {
    if (!dialogRide) {
      return;
    }
    setSaving(true);
    try {
      await dispatchApi.assignResources(dialogRide.rideId, {
        driverId: selectedDriverId === "" ? null : selectedDriverId,
        vehicleId: selectedVehicleId === "" ? null : selectedVehicleId,
      });
      showSuccess("Dispatch assignment updated successfully.");
      setDialogRide(null);
      await loadBoard();
    } catch {
      showError("Ride resources could not be assigned.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassign(type: "driver" | "vehicle", rideId: number) {
    try {
      if (type === "driver") {
        await dispatchApi.unassignDriver(rideId);
      } else {
        await dispatchApi.unassignVehicle(rideId);
      }
      showSuccess("Dispatch assignment updated successfully.");
      await loadBoard();
    } catch {
      showError("Dispatch assignment could not be updated.");
    }
  }

  if (loading && items.length === 0) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Operations"
        title="Dispatch Board"
        description="Review scheduled work, assign drivers and vehicles, and surface dispatch exceptions from one board."
      >
        <Button variant="contained" onClick={() => navigate("/company/routes")}>
          Manage Routes
        </Button>
      </SectionHeader>

      <Stack
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
        }}
      >
        <MetricCard
          icon={<EventAvailableRoundedIcon color="primary" />}
          label="Scheduled"
          value={summary.scheduledCount}
        />
        <MetricCard
          icon={<AssignmentIndRoundedIcon color="primary" />}
          label="Assigned"
          value={summary.assignedCount}
        />
        <MetricCard
          icon={<RouteRoundedIcon color="primary" />}
          label="In Progress"
          value={summary.inProgressCount}
        />
        <MetricCard
          icon={<ErrorOutlineRoundedIcon color="error" />}
          label="Exceptions"
          value={summary.exceptionCount}
        />
        <MetricCard
          icon={<FactCheckRoundedIcon color="primary" />}
          label="Completed Today"
          value={summary.completedTodayCount}
        />
        <MetricCard
          icon={<DirectionsCarFilledRoundedIcon color="primary" />}
          label="No Shows Today"
          value={summary.noShowTodayCount}
        />
      </Stack>

      <AdminFilterBar stackProps={{ alignItems: { md: "center" } }}>
        <TextField
          label="Search"
          value={filters.keyword}
          onChange={(event) => updateFilters("keyword", event.target.value)}
        />
        <TextField
          select
          label="Board View"
          value={filters.view}
          onChange={(event) =>
            updateFilters(
              "view",
              event.target.value as DispatchSearchParams["view"],
            )
          }
          sx={{ minWidth: 180 }}
        >
          {dispatchViewOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
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
          {rideStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
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
          {serviceTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="From"
          type="date"
          value={filters.fromDate}
          onChange={(event) => updateFilters("fromDate", event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          value={filters.toDate}
          onChange={(event) => updateFilters("toDate", event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ride</TableCell>
              <TableCell>Window</TableCell>
              <TableCell>Assignment</TableCell>
              <TableCell>Warnings</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.rideId} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{item.rideNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.riderName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.organizationName ?? "No organization"}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      <StatusChip value={item.status} />
                      <StatusChip value={item.serviceType} />
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Pickup: {formatDateTime(item.scheduledPickupAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dropoff:{" "}
                      {item.scheduledDropoffAt
                        ? formatDateTime(item.scheduledDropoffAt)
                        : "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.pickupAddress}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Driver: {item.driverName ?? "Unassigned"}
                    </Typography>
                    <Typography variant="body2">
                      Vehicle: {item.vehicleDisplayName ?? "Unassigned"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Route: {item.routeId ? `#${item.routeId}` : "Not routed"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {item.warningMessages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No exceptions
                    </Typography>
                  ) : (
                    <Stack spacing={0.5}>
                      {item.warningMessages.map((message) => (
                        <Typography
                          key={message}
                          variant="caption"
                          color="error.main"
                        >
                          {message}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <TableActionButton
                      title="View Ride"
                      onClick={() => navigate(`/company/rides/${item.rideId}`)}
                    >
                      <VisibilityRoundedIcon />
                    </TableActionButton>
                    <TableActionButton
                      title="Assign Resources"
                      onClick={() => {
                        setDialogRide(item);
                        setSelectedDriverId(item.driverId ?? "");
                        setSelectedVehicleId(item.vehicleId ?? "");
                      }}
                    >
                      <AssignmentIndRoundedIcon />
                    </TableActionButton>
                    {item.driverId ? (
                      <Button
                        size="small"
                        onClick={() =>
                          void handleUnassign("driver", item.rideId)
                        }
                      >
                        Remove Driver
                      </Button>
                    ) : null}
                    {item.vehicleId ? (
                      <Button
                        size="small"
                        onClick={() =>
                          void handleUnassign("vehicle", item.rideId)
                        }
                      >
                        Remove Vehicle
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && items.length === 0 ? (
          <EmptyState
            title="No dispatch work found"
            description="Adjust the current filters or date range to surface scheduled work."
          />
        ) : null}
        <TablePagination
          component="div"
          count={total}
          page={filters.page}
          onPageChange={(_, nextPage) => updateFilters("page", nextPage)}
          rowsPerPage={filters.size}
          onRowsPerPageChange={(event) =>
            updateFilters("size", Number(event.target.value))
          }
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      <Dialog
        open={Boolean(dialogRide)}
        onClose={() => setDialogRide(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Ride Resources</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">
              {dialogRide
                ? `Update dispatch assignments for ${dialogRide.rideNumber}.`
                : ""}
            </Typography>
            <TextField
              select
              label="Driver"
              value={selectedDriverId}
              onChange={(event) =>
                setSelectedDriverId(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            >
              <MenuItem value="">No change</MenuItem>
              {driverOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                  {option.code ? ` (${option.code})` : ""}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Vehicle"
              value={selectedVehicleId}
              onChange={(event) =>
                setSelectedVehicleId(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            >
              <MenuItem value="">No change</MenuItem>
              {vehicleOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                  {option.code ? ` (${option.code})` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRide(null)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => void handleAssignmentSave()}
            disabled={saving}
          >
            Save Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
