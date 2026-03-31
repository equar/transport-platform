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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import { dispatchApi, type LookupOption } from "../../dispatch/api/dispatchApi";
import { serviceTypeOptions, type ServiceType } from "../../rides/api/ridesApi";
import {
  routeStatusOptions,
  routesApi,
  type RoutePayload,
  type RouteRecord,
  type RouteSearchParams,
  type RouteStatus,
} from "../api/routesApi";

function defaultFilters(): RouteSearchParams {
  return {
    keyword: "",
    status: "",
    serviceType: "",
    fromDate: "",
    toDate: "",
    driverId: null,
    page: 0,
    size: 10,
    sortBy: "routeDate",
    sortDirection: "ASC",
  };
}

function defaultPayload(): RoutePayload {
  return {
    routeName: "",
    routeDate: "",
    serviceType: "GENERAL_TRANSPORT",
    startTime: "",
    endTime: "",
    manifestNotes: "",
    notes: "",
    status: "DRAFT",
  };
}

export function RouteManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [filters, setFilters] = useState<RouteSearchParams>(defaultFilters());
  const [items, setItems] = useState<RouteRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [driverOptions, setDriverOptions] = useState<LookupOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteRecord | null>(null);
  const [payload, setPayload] = useState<RoutePayload>(defaultPayload());
  const [assignmentRoute, setAssignmentRoute] = useState<RouteRecord | null>(
    null,
  );
  const [assignmentDriverId, setAssignmentDriverId] = useState<number | "">("");
  const [assignmentVehicleId, setAssignmentVehicleId] = useState<number | "">(
    "",
  );
  const [saving, setSaving] = useState(false);

  async function loadRoutes() {
    setLoading(true);
    setError(null);
    try {
      const [response, drivers, vehicles] = await Promise.all([
        routesApi.search(filters),
        dispatchApi.listDriverOptions(),
        dispatchApi.listVehicleOptions(),
      ]);
      setItems(response.items);
      setTotal(response.totalElements);
      setDriverOptions(drivers);
      setVehicleOptions(vehicles);
    } catch {
      setError("Routes could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoutes();
  }, [filters]);

  function updateFilters<K extends keyof RouteSearchParams>(
    field: K,
    value: RouteSearchParams[K],
  ) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? Number(value) : 0,
      [field]: value,
    }));
  }

  function openCreateDialog() {
    setSelectedRoute(null);
    setPayload(defaultPayload());
    setDialogOpen(true);
  }

  function openEditDialog(route: RouteRecord) {
    setSelectedRoute(route);
    setPayload({
      routeName: route.routeName,
      routeDate: route.routeDate,
      serviceType: route.serviceType,
      startTime: route.startTime,
      endTime: route.endTime,
      manifestNotes: route.manifestNotes ?? "",
      notes: route.notes ?? "",
      status: route.status === "PLANNED" ? "PLANNED" : "DRAFT",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      if (selectedRoute) {
        await routesApi.update(selectedRoute.id, payload);
        showSuccess("Route updated successfully.");
      } else {
        await routesApi.create(payload);
        showSuccess("Route created successfully.");
      }
      setDialogOpen(false);
      await loadRoutes();
    } catch {
      showError("Route changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignmentSave() {
    if (!assignmentRoute) {
      return;
    }
    setSaving(true);
    try {
      await routesApi.assignResources(assignmentRoute.id, {
        driverId: assignmentDriverId === "" ? null : assignmentDriverId,
        vehicleId: assignmentVehicleId === "" ? null : assignmentVehicleId,
      });
      showSuccess("Route resources updated successfully.");
      setAssignmentRoute(null);
      await loadRoutes();
    } catch {
      showError("Route resources could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLifecycle(
    route: RouteRecord,
    action: "ready" | "start" | "complete" | "cancel",
  ) {
    try {
      switch (action) {
        case "ready":
          await routesApi.markReady(route.id);
          break;
        case "start":
          await routesApi.start(route.id);
          break;
        case "complete":
          await routesApi.complete(route.id);
          break;
        case "cancel":
          await routesApi.cancel(route.id);
          break;
      }
      showSuccess("Route updated successfully.");
      await loadRoutes();
    } catch {
      showError("Route status could not be updated.");
    }
  }

  if (loading && items.length === 0) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Operations"
        title="Route Management"
        description="Build route manifests, assign fleet resources, and move operational routes through readiness and completion."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateDialog}
        >
          Create Route
        </Button>
      </SectionHeader>

      <AdminFilterBar stackProps={{ alignItems: { md: "center" } }}>
        <TextField
          label="Search"
          value={filters.keyword}
          onChange={(event) => updateFilters("keyword", event.target.value)}
        />
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(event) =>
            updateFilters("status", event.target.value as RouteStatus | "")
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {routeStatusOptions.map((option) => (
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
              <TableCell>Route</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Assignments</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((route) => (
              <TableRow key={route.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{route.routeCode}</Typography>
                    <Typography variant="body2">{route.routeName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {route.linkedRideCount} linked ride(s)
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{route.routeDate}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {route.startTime ?? "-"} to {route.endTime ?? "-"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Driver: {route.assignedDriverName ?? "Unassigned"}
                    </Typography>
                    <Typography variant="body2">
                      Vehicle: {route.assignedVehicleSummary ?? "Unassigned"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <StatusChip value={route.status} />
                    <StatusChip value={route.serviceType} />
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <TableActionButton
                      title="View Route"
                      onClick={() => navigate(`/company/routes/${route.id}`)}
                    >
                      <VisibilityRoundedIcon />
                    </TableActionButton>
                    {route.status === "DRAFT" || route.status === "PLANNED" ? (
                      <TableActionButton
                        title="Edit Route"
                        onClick={() => openEditDialog(route)}
                      >
                        <EditRoundedIcon />
                      </TableActionButton>
                    ) : null}
                    {route.status === "DRAFT" || route.status === "PLANNED" ? (
                      <TableActionButton
                        title="Assign Resources"
                        onClick={() => {
                          setAssignmentRoute(route);
                          setAssignmentDriverId(route.assignedDriverId ?? "");
                          setAssignmentVehicleId(route.assignedVehicleId ?? "");
                        }}
                      >
                        <TaskAltRoundedIcon />
                      </TableActionButton>
                    ) : null}
                    {route.status === "DRAFT" || route.status === "PLANNED" ? (
                      <Button
                        size="small"
                        onClick={() => void handleLifecycle(route, "ready")}
                      >
                        Ready
                      </Button>
                    ) : null}
                    {route.status === "READY" ? (
                      <TableActionButton
                        title="Start Route"
                        onClick={() => void handleLifecycle(route, "start")}
                      >
                        <PlayCircleRoundedIcon />
                      </TableActionButton>
                    ) : null}
                    {route.status === "IN_PROGRESS" ? (
                      <Button
                        size="small"
                        onClick={() => void handleLifecycle(route, "complete")}
                      >
                        Complete
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
            title="No routes found"
            description="Create a route or broaden the current filters to see existing route work."
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
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedRoute ? "Edit Route" : "Create Route"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Route Name"
              value={payload.routeName}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  routeName: event.target.value,
                }))
              }
            />
            <TextField
              label="Route Date"
              type="date"
              value={payload.routeDate}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  routeDate: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Service Type"
              value={payload.serviceType}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  serviceType: event.target.value as ServiceType,
                }))
              }
            >
              {serviceTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start Time"
                type="time"
                value={payload.startTime ?? ""}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Time"
                type="time"
                value={payload.endTime ?? ""}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Manifest Notes"
              value={payload.manifestNotes ?? ""}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  manifestNotes: event.target.value,
                }))
              }
              multiline
              minRows={2}
            />
            <TextField
              label="Notes"
              value={payload.notes ?? ""}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              multiline
              minRows={2}
            />
            <TextField
              select
              label="Initial Status"
              value={payload.status ?? "DRAFT"}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  status: event.target.value as RoutePayload["status"],
                }))
              }
            >
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="PLANNED">PLANNED</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            Save Route
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(assignmentRoute)}
        onClose={() => setAssignmentRoute(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Route Resources</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">
              Select an available driver and vehicle for this route manifest.
            </Typography>
            <TextField
              select
              label="Driver"
              value={assignmentDriverId}
              onChange={(event) =>
                setAssignmentDriverId(
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
              value={assignmentVehicleId}
              onChange={(event) =>
                setAssignmentVehicleId(
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
          <Button onClick={() => setAssignmentRoute(null)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => void handleAssignmentSave()}
            disabled={saving}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
