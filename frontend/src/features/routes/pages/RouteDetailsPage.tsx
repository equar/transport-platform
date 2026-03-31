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
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  dispatchApi,
  type DispatchRideRecord,
  type LookupOption,
} from "../../dispatch/api/dispatchApi";
import {
  routesApi,
  type AddRouteStopPayload,
  type RouteRecord,
} from "../api/routesApi";

export function RouteDetailsPage() {
  const { routeId } = useParams();
  const resolvedRouteId = Number(routeId);
  const { showError, showSuccess } = useToast();
  const [route, setRoute] = useState<RouteRecord | null>(null);
  const [candidateRides, setCandidateRides] = useState<DispatchRideRecord[]>(
    [],
  );
  const [driverOptions, setDriverOptions] = useState<LookupOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | "">("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | "">("");
  const [stopPayload, setStopPayload] = useState<AddRouteStopPayload>({
    rideId: 0,
    stopSequence: null,
    plannedPickupAt: "",
    plannedDropoffAt: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadRoute() {
    if (!resolvedRouteId) {
      setError("Route was not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [routeResponse, ridesResponse, drivers, vehicles] =
        await Promise.all([
          routesApi.getById(resolvedRouteId),
          dispatchApi.search({
            keyword: "",
            view: "ALL",
            status: "SCHEDULED",
            serviceType: "",
            driverId: null,
            vehicleId: null,
            organizationId: null,
            fromDate: "",
            toDate: "",
            page: 0,
            size: 100,
            sortBy: "scheduledPickupAt",
            sortDirection: "ASC",
          }),
          dispatchApi.listDriverOptions(),
          dispatchApi.listVehicleOptions(),
        ]);
      setRoute(routeResponse);
      setCandidateRides(
        ridesResponse.items.filter(
          (item) => item.routeId == null || item.routeId === routeResponse.id,
        ),
      );
      setDriverOptions(drivers);
      setVehicleOptions(vehicles);
      setSelectedDriverId(routeResponse.assignedDriverId ?? "");
      setSelectedVehicleId(routeResponse.assignedVehicleId ?? "");
    } catch {
      setError("Route details could not be loaded.");
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoute();
  }, [resolvedRouteId]);

  async function handleAddStop() {
    if (!route) {
      return;
    }
    setSaving(true);
    try {
      await routesApi.addStop(route.id, stopPayload);
      showSuccess("Ride added to route successfully.");
      setStopDialogOpen(false);
      setStopPayload({
        rideId: 0,
        stopSequence: null,
        plannedPickupAt: "",
        plannedDropoffAt: "",
        notes: "",
      });
      await loadRoute();
    } catch {
      showError("Ride could not be added to the route.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorder(stopId: number, direction: "up" | "down") {
    if (!route?.stops) {
      return;
    }
    const currentIndex = route.stops.findIndex((item) => item.id === stopId);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= route.stops.length) {
      return;
    }
    const reordered = [...route.stops];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    try {
      await routesApi.reorderStops(
        route.id,
        reordered.map((item, index) => ({
          routeStopId: item.id,
          stopSequence: index + 1,
        })),
      );
      showSuccess("Route stop order updated successfully.");
      await loadRoute();
    } catch {
      showError("Route stops could not be reordered.");
    }
  }

  async function handleRemoveStop(stopId: number) {
    if (!route) {
      return;
    }
    try {
      await routesApi.removeStop(route.id, stopId);
      showSuccess("Route stop removed successfully.");
      await loadRoute();
    } catch {
      showError("Route stop could not be removed.");
    }
  }

  async function handleAssignmentSave() {
    if (!route) {
      return;
    }
    setSaving(true);
    try {
      await routesApi.assignResources(route.id, {
        driverId: selectedDriverId === "" ? null : selectedDriverId,
        vehicleId: selectedVehicleId === "" ? null : selectedVehicleId,
      });
      showSuccess("Route resources updated successfully.");
      setAssignmentDialogOpen(false);
      await loadRoute();
    } catch {
      showError("Route resources could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLifecycle(action: "ready" | "start" | "complete") {
    if (!route) {
      return;
    }
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
      }
      showSuccess("Route updated successfully.");
      await loadRoute();
    } catch {
      showError("Route status could not be updated.");
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !route) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/routes"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Routes
        </Button>
        <Alert severity="error">{error ?? "Route was not found."}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/routes"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Routes
      </Button>

      <SectionHeader
        eyebrow="Company Operations"
        title={`${route.routeCode} · ${route.routeName}`}
        description="Manage stop sequencing, route resources, and manifest readiness from a single route workspace."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<TaskAltRoundedIcon />}
            onClick={() => setAssignmentDialogOpen(true)}
          >
            Assign Resources
          </Button>
          <Button
            variant="contained"
            startIcon={<PlaylistAddRoundedIcon />}
            onClick={() => setStopDialogOpen(true)}
          >
            Add Ride Stop
          </Button>
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <StatusChip value={route.status} />
            <StatusChip value={route.serviceType} />
          </Stack>
          <Typography color="text.secondary">
            Date: {route.routeDate}
          </Typography>
          <Typography color="text.secondary">
            Driver: {route.assignedDriverName ?? "Unassigned"}
          </Typography>
          <Typography color="text.secondary">
            Vehicle: {route.assignedVehicleSummary ?? "Unassigned"}
          </Typography>
          <Typography color="text.secondary">
            Linked rides: {route.linkedRideCount}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {route.status === "DRAFT" || route.status === "PLANNED" ? (
              <Button onClick={() => void handleLifecycle("ready")}>
                Mark Ready
              </Button>
            ) : null}
            {route.status === "READY" ? (
              <Button
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => void handleLifecycle("start")}
              >
                Start Route
              </Button>
            ) : null}
            {route.status === "IN_PROGRESS" ? (
              <Button onClick={() => void handleLifecycle("complete")}>
                Complete Route
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </PageCard>

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
              <TableCell>Seq</TableCell>
              <TableCell>Ride</TableCell>
              <TableCell>Window</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {route.stops?.map((stop, index) => (
              <TableRow key={stop.id} hover>
                <TableCell>{stop.stopSequence}</TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{stop.rideNumber}</Typography>
                    <Typography variant="body2">{stop.riderName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stop.pickupSummary}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {stop.plannedPickupAt
                      ? formatDateTime(stop.plannedPickupAt)
                      : "-"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stop.plannedDropoffAt
                      ? formatDateTime(stop.plannedDropoffAt)
                      : "-"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <StatusChip value={stop.status} />
                    <StatusChip value={stop.rideStatus} />
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <TableActionButton
                      title="Move Up"
                      onClick={() => void handleReorder(stop.id, "up")}
                    >
                      <ArrowUpwardRoundedIcon />
                    </TableActionButton>
                    <TableActionButton
                      title="Move Down"
                      onClick={() => void handleReorder(stop.id, "down")}
                    >
                      <ArrowDownwardRoundedIcon />
                    </TableActionButton>
                    <TableActionButton
                      title="Remove Stop"
                      onClick={() => void handleRemoveStop(stop.id)}
                    >
                      <DeleteRoundedIcon />
                    </TableActionButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {route.stops?.length === 0 ? (
          <EmptyState
            title="No route stops yet"
            description="Add scheduled rides to build the route sequence and manifest."
          />
        ) : null}
      </Paper>

      <Dialog
        open={stopDialogOpen}
        onClose={() => setStopDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Ride Stop</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Ride"
              value={stopPayload.rideId || ""}
              onChange={(event) =>
                setStopPayload((current) => ({
                  ...current,
                  rideId: Number(event.target.value),
                }))
              }
            >
              <MenuItem value="">Select a ride</MenuItem>
              {candidateRides.map((item) => (
                <MenuItem key={item.rideId} value={item.rideId}>
                  {item.rideNumber} · {item.riderName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Target Sequence"
              type="number"
              value={stopPayload.stopSequence ?? ""}
              onChange={(event) =>
                setStopPayload((current) => ({
                  ...current,
                  stopSequence: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
            />
            <TextField
              label="Planned Pickup"
              type="datetime-local"
              value={stopPayload.plannedPickupAt ?? ""}
              onChange={(event) =>
                setStopPayload((current) => ({
                  ...current,
                  plannedPickupAt: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Planned Dropoff"
              type="datetime-local"
              value={stopPayload.plannedDropoffAt ?? ""}
              onChange={(event) =>
                setStopPayload((current) => ({
                  ...current,
                  plannedDropoffAt: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notes"
              value={stopPayload.notes ?? ""}
              onChange={(event) =>
                setStopPayload((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => void handleAddStop()}
            disabled={saving || !stopPayload.rideId}
          >
            Add Stop
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Route Resources</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Close</Button>
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
