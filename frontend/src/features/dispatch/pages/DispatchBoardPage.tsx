import { useAuth } from "../../auth/context/AuthContext";
import {
  Alert,
  Checkbox,
  Autocomplete,
  TableContainer,
  Box,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  type DispatchRideMapRecord,
  type DispatchRideRecord,
  type DispatchSearchParams,
  type LookupOption,
} from "../api/dispatchApi";
import {
  serviceTypeOptions,
  rideStatusOptions,
  ridesApi,
  type RideStatus,
  type ServiceType,
} from "../../rides/api/ridesApi";
import { useRuntimeCapabilities } from "../../runtime/context/RuntimeCapabilitiesContext";
import { env } from "../../../shared/config/env";

function todayValue(zone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (name: string) => parts.find(item => item.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const lifecycleActions: Partial<Record<RideStatus, { label: string; run: (rideId: number) => Promise<unknown> }>> = {
  ASSIGNED: { label: "Start trip", run: ridesApi.markDriverEnRoute },
  DRIVER_EN_ROUTE: { label: "Mark arrived", run: ridesApi.markArrived },
  ARRIVED: { label: "Pick up rider", run: ridesApi.markPickedUp },
  PICKED_UP: { label: "Mark dropped off", run: ridesApi.markDroppedOff },
  DROPPED_OFF: { label: "Complete trip", run: ridesApi.complete },
};

function formatMapSpeed(speedMps: number | null) {
  if (speedMps == null) return "-";
  return `${(speedMps * 3.6).toFixed(1)} km/h`;
}

function buildDispatchStaticMapUrl(items: DispatchRideMapRecord[]) {
  if (items.length === 0 || !env.googleMapsApiKey) return null;
  const markerParams = items
    .map(
      (item, index) =>
        `markers=color:0x37474fff|label:${String.fromCharCode(65 + (index % 26))}|${item.latitude},${item.longitude}`,
    )
    .join("&");
  return `https://maps.googleapis.com/maps/api/staticmap?size=1200x520&scale=2&maptype=roadmap&${markerParams}&key=${encodeURIComponent(env.googleMapsApiKey)}`;
}

function defaultFilters(zone?: string): DispatchSearchParams {
  return {
    keyword: "",
    view: "ALL",
    status: "",
    serviceType: "",
    driverId: null,
    vehicleId: null,
    organizationId: null,
    fromDate: todayValue(zone),
    toDate: todayValue(zone),
    page: 0,
    size: 10,
    sortBy: "scheduledPickupAt",
    sortDirection: "ASC",
  };
}

export function DispatchBoardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { capabilities } = useRuntimeCapabilities();
  const tenantZone = capabilities?.operationalSettings.timezone ?? 'UTC';
  const savedKey = `dispatch-saved-view:${session?.identity.tenantId}:${session?.identity.id}`;
  const { showError, showSuccess } = useToast();
  const [filters, setFilters] =
    useState<DispatchSearchParams>(() => {
      const initial = defaultFilters(tenantZone);
      for (const key of ['keyword', 'fromDate', 'toDate'] as const) if (searchParams.has(key)) initial[key] = searchParams.get(key)!;
      const view = searchParams.get('view');
      if (view && ['ALL', 'UNASSIGNED', 'ASSIGNED', 'EXCEPTIONS'].includes(view)) initial.view = view as DispatchSearchParams['view'];
      const page = Number(searchParams.get('page'));
      if (Number.isInteger(page) && page >= 0) initial.page = page;
      return initial;
    });
  const initialDateProvided = useRef(searchParams.has('fromDate'));
  const adjustedTenantDay = useRef(false);
  useEffect(() => {
    if (!capabilities || adjustedTenantDay.current) return;
    adjustedTenantDay.current = true;
    if (!initialDateProvided.current) setFilters(current => ({ ...current, fromDate: todayValue(tenantZone), toDate: todayValue(tenantZone) }));
  }, [capabilities, tenantZone]);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulk, setBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ rideId: number; success: boolean; message: string }[] | null>(null);
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
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapItems, setMapItems] = useState<DispatchRideMapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogRide, setDialogRide] = useState<DispatchRideRecord | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | "">("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [transitioningRideId, setTransitioningRideId] = useState<number | null>(null);

  const selectedDriverOption =
    selectedDriverId === ""
      ? null
      : driverOptions.find((item) => item.id === selectedDriverId) ?? null;

  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const resourceCache = useRef<{ time: number; promise: Promise<[LookupOption[], LookupOption[]]> } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== null && value !== '') params.set(key, String(value));
    setSearchParams(params, { replace: true });
  }, [filters]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  async function loadBoard() {
    const currentRequest = ++requestId.current;
    controller.current?.abort();
    const activeController = new AbortController();
    controller.current = activeController;
    if (!resourceCache.current || Date.now() - resourceCache.current.time > 300000) {
      resourceCache.current = { time: Date.now(), promise: Promise.all([dispatchApi.listDriverOptions(), dispatchApi.listVehicleOptions()]) };
    }
    setLoading(true);
    setError(null);
    try {
      const boardParams = {
        keyword: filters.keyword,
        status: filters.status,
        serviceType: filters.serviceType,
        driverId: filters.driverId,
        vehicleId: filters.vehicleId,
        organizationId: filters.organizationId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      };
      const [pageResponse, summaryResponse, mapResponse, drivers, vehicles] =
        await Promise.all([
          dispatchApi.search(filters, activeController.signal),
          dispatchApi.getSummary(boardParams, activeController.signal),
          dispatchApi.getMap(boardParams, activeController.signal).catch(() => null),
          resourceCache.current.promise.then(values => values[0]),
          resourceCache.current.promise.then(values => values[1]),
        ]);
      if (currentRequest !== requestId.current) return;
      setLastUpdated(new Date());
      setItems(pageResponse.items);
      setTotal(pageResponse.totalElements);
      setSummary(summaryResponse);
      setMapUnavailable(mapResponse === null);
      if (mapResponse) setMapItems(mapResponse);
      setDriverOptions(drivers);
      setVehicleOptions(vehicles);
    } catch {
      if (currentRequest === requestId.current && !activeController.signal.aborted) { resourceCache.current = null; setError("Dispatch board data could not be loaded. Showing the last available data."); }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBoard(), 300);
    return () => { window.clearTimeout(timer); requestId.current++; controller.current?.abort(); };
  }, [filters]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadBoard();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    if (!dialogRide || selectedDriverId === "" || selectedVehicleId !== "") {
      return;
    }

    const linkedVehicleId =
      driverOptions.find((item) => item.id === selectedDriverId)?.assignedVehicleId ??
      null;
    if (linkedVehicleId != null) {
      setSelectedVehicleId(linkedVehicleId);
    }
  }, [dialogRide, driverOptions, selectedDriverId, selectedVehicleId]);

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

  async function handleBulk(preview: boolean) {
    setSaving(true);
    try {
      const results = await dispatchApi.bulkResources({
        rides: items.filter(item => selected.includes(item.rideId)).map(item => ({ rideId: item.rideId, expectedVersion: item.version })),
        driverId: selectedDriverId === '' ? null : selectedDriverId,
        vehicleId: selectedVehicleId === '' ? null : selectedVehicleId,
        preview,
      });
      setBulkResult(results);
      if (!preview) { await loadBoard(); setSelected([]); }
    } catch (error) { showError(error, 'Bulk assignment failed.'); }
    finally { setSaving(false); }
  }

  async function handleAssignmentSave() {
    if (!dialogRide) {
      return;
    }
    setSaving(true);
    try {
      const nextDriverId = selectedDriverId === "" ? null : selectedDriverId;
      const nextVehicleId = selectedVehicleId === "" ? null : selectedVehicleId;

      await dispatchApi.replaceResources(dialogRide.rideId, {
        driverId: nextDriverId, vehicleId: nextVehicleId, expectedVersion: dialogRide.version,
      });
      showSuccess("Dispatch assignment updated successfully.");
      setDialogRide(null);
      await loadBoard();
    } catch (error) {
      showError(error, "Ride resources could not be assigned.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLifecycleAction(item: DispatchRideRecord) {
    const action = lifecycleActions[item.status];
    if (!action) return;
    setTransitioningRideId(item.rideId);
    try {
      await action.run(item.rideId);
      showSuccess(`${item.rideNumber}: ${action.label.toLowerCase()} completed.`);
      await loadBoard();
    } catch {
      showError(`Could not update ${item.rideNumber}. Refresh the board and verify its current status.`);
    } finally {
      setTransitioningRideId(null);
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

  const staticMapUrl = buildDispatchStaticMapUrl(mapItems);

  return (
    <Stack spacing={2}>
      <SectionHeader
        eyebrow="Company Operations"
        title="Dispatch Board"
        description="Review scheduled work, assign drivers and vehicles, and surface dispatch exceptions from one board."
      >
        <Button variant="contained" onClick={() => navigate("/company/routes")}>
          Manage Routes
        </Button>
      </SectionHeader>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Needs attention</Typography>
        <Typography variant="caption">Current page • Company timezone: {tenantZone}</Typography>
        {items.filter(item => item.warningMessages.length || ['FAILED', 'MISSED', 'RIDER_NO_SHOW'].includes(item.status) || (!item.driverId && item.status === 'SCHEDULED')).slice(0, 8).map(item =>
          <Stack key={item.rideId} direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" sx={{ py: 1 }}>
            <Box><Typography fontWeight={700}>{item.rideNumber} • {item.riderName}</Typography><Typography variant="body2">{item.warningMessages.join(' · ') || (item.driverId ? 'Trip exception: contact driver and rider' : 'Needs a driver')} • {item.driverName ?? 'Dispatch team'}</Typography></Box>
            <Button onClick={() => navigate(`/company/rides/${item.rideId}`)}>Review trip</Button>
          </Stack>)}
        <Stack direction="row" spacing={1}>
          <Button onClick={() => updateFilters('view', 'EXCEPTIONS')}>All exceptions</Button>
          <Button onClick={() => { sessionStorage.setItem(savedKey, JSON.stringify(filters)); showSuccess('View saved for this browser session.'); }}>Save view</Button>
          <Button onClick={() => { try { const saved = sessionStorage.getItem(savedKey); if (saved) setFilters({ ...defaultFilters(tenantZone), ...JSON.parse(saved) }); } catch { showError('Saved view is unavailable.'); } }}>Restore saved view</Button>
        </Stack>
      </Paper>
      <Typography variant="caption" role="status">{loading ? "Refreshing dispatch…" : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for dispatch data"}</Typography>
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

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography variant="h5">Operations Map</Typography>
              <Typography variant="body2" color="text.secondary">
                Active assigned and in-progress rides with the latest available driver snapshot.
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {mapItems.length} active ride{mapItems.length === 1 ? "" : "s"} on map
            </Typography>
          </Stack>
          {mapUnavailable ? <Alert severity="warning">The map could not refresh. Any displayed locations are from the last successful update.</Alert> : null}
          {staticMapUrl ? (
            <Box
              component="img"
              src={staticMapUrl}
              alt="Dispatch operations map"
              sx={{
                width: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "grey.100",
              }}
            />
          ) : (
            <Alert severity="info">
              {mapItems.length > 0 && !env.googleMapsApiKey
                ? "The operations map is unavailable. Trip details remain available below."
                : "No active rides with captured driver locations are available for this window yet."}
            </Alert>
          )}
          {mapItems.length > 0 ? (
            <Stack
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(3, minmax(0, 1fr))",
                },
              }}
            >
              {mapItems.map((item, index) => (
                <Paper
                  key={item.rideId}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 3, backgroundColor: "background.default" }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="subtitle2">
                        {String.fromCharCode(65 + (index % 26))}. {item.rideNumber}
                      </Typography>
                      <StatusChip value={item.status} />
                    </Stack>
                    <Typography variant="body2">{item.riderName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Driver: {item.driverName ?? "Unassigned"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Speed: {formatMapSpeed(item.speedMps)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Accuracy: {item.accuracyMeters != null ? `${item.accuracyMeters.toFixed(1)} m` : "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Captured: {formatDateTime(item.capturedAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pickup: {item.pickupAddress}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate(`/company/rides/${item.rideId}`)}
                      >
                        Open Ride
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        component="a"
                        href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Maps
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.5}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.view}
          onChange={(_, value: DispatchSearchParams["view"] | null) => value && updateFilters("view", value)}
          aria-label="Dispatch queue"
        >
          <ToggleButton value="ALL">Today’s board</ToggleButton>
          <ToggleButton value="UNASSIGNED">Needs assignment</ToggleButton>
          <ToggleButton value="ASSIGNED">Assigned</ToggleButton>
          <ToggleButton value="EXCEPTIONS">Exceptions</ToggleButton>
        </ToggleButtonGroup>
        <Button
          size="small"
          onClick={() => setFilters(defaultFilters(tenantZone))}
          disabled={JSON.stringify(filters) === JSON.stringify(defaultFilters(tenantZone))}
        >
          Reset to today
        </Button>
      </Stack>

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
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button disabled={!items.some(item => selected.includes(item.rideId))} onClick={() => { setBulk(true); setBulkResult(null); setSelectedDriverId(''); setSelectedVehicleId(''); }}>Assign selected rides</Button>
        <TableContainer sx={{ overflowX: "auto" }}><Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Select</TableCell>
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
                <TableCell><Checkbox disabled={!['SCHEDULED', 'ASSIGNED'].includes(item.status)} checked={selected.includes(item.rideId)} inputProps={{ 'aria-label': `Select ${item.rideNumber}` }} onChange={(_, checked) => setSelected(values => checked ? [...values, item.rideId] : values.filter(id => id !== item.rideId))} /></TableCell>
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
                    <Typography variant="caption" color="text.secondary">
                      → {item.dropoffAddress}
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
                    {lifecycleActions[item.status] ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void handleLifecycleAction(item)}
                        disabled={transitioningRideId === item.rideId}
                      >
                        {transitioningRideId === item.rideId
                          ? "Updating…"
                          : lifecycleActions[item.status]?.label}
                      </Button>
                    ) : null}
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
        </Table></TableContainer>
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
        open={Boolean(dialogRide) || bulk}
        onClose={() => { setDialogRide(null); setBulk(false); }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{bulk ? `Assign ${selected.length} selected rides` : "Assign Ride Resources"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {dialogRide
                ? `Update dispatch assignments for ${dialogRide.rideNumber}.`
                : ""}
            </Typography>
            {bulk ? <Alert severity="info">Preview each ride before saving. Availability can change; any failed assignments will be reported individually.</Alert> : null}
            {bulkResult?.map(result => <Alert key={result.rideId} severity={result.success ? 'success' : 'error'}>Ride #{result.rideId}: {result.message}</Alert>)}
            <Autocomplete
              options={driverOptions}
              getOptionLabel={option => `${option.label} ${option.code ?? ''}`}
              value={driverOptions.find(option => option.id === selectedDriverId) ?? null}
              onChange={(_, option) => { setBulkResult(null); setSelectedDriverId(option?.id ?? ""); if (option?.assignedVehicleId) setSelectedVehicleId(option.assignedVehicleId); }}
              renderInput={params => <TextField {...params} label="Search compliant drivers" />}
            />
            <Autocomplete
              options={vehicleOptions}
              getOptionLabel={option => `${option.label} ${option.code ?? ''}`}
              value={vehicleOptions.find(option => option.id === selectedVehicleId) ?? null}
              onChange={(_, option) => { setBulkResult(null); setSelectedVehicleId(option?.id ?? ""); }}
              renderInput={params => <TextField {...params} label="Search compliant vehicles" />}
            />
            <Typography variant="caption" color="text.secondary">
              {selectedDriverOption?.assignedVehicleId
                ? "A linked driver vehicle was applied automatically. You can keep it or leave the vehicle unassigned."
                : "Vehicle is optional. If the selected driver has a linked vehicle, it will be applied automatically."}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogRide(null); setBulk(false); }}>Close</Button>
          {bulk ? <Button disabled={saving || selected.length === 0} onClick={() => void handleBulk(!bulkResult)}>{bulkResult ? 'Save assignments' : 'Preview assignments'}</Button> : <>
          <Button
            variant="contained"
            onClick={() => void handleAssignmentSave()}
            disabled={saving || !dialogRide || (
              (selectedDriverId === "" ? null : selectedDriverId) === dialogRide.driverId &&
              (selectedVehicleId === "" ? null : selectedVehicleId) === dialogRide.vehicleId
            )}
          >
            Save Assignment
          </Button>
          </>}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
