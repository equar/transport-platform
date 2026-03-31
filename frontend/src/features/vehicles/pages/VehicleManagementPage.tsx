import {
  Alert,
  Button,
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
import BuildCircleRoundedIcon from "@mui/icons-material/BuildCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  vehicleServiceTypeOptions,
  vehiclesApi,
  type VehicleOwnershipType,
  type VehiclePayload,
  type VehicleRecord,
  type VehicleStatus,
} from "../api/vehiclesApi";
import { VehicleUpsertDialog } from "../components/VehicleUpsertDialog";

const vehicleStatuses: Array<VehicleStatus | ""> = [
  "",
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "OUT_OF_SERVICE",
  "SUSPENDED",
];

const ownershipTypes: Array<VehicleOwnershipType | ""> = [
  "",
  "COMPANY_OWNED",
  "DRIVER_OWNED",
  "LEASED",
];

type VehicleAction = "activate" | "suspend" | "maintenance" | "out-of-service";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function VehicleManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<VehicleRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "">("");
  const [ownershipType, setOwnershipType] = useState<VehicleOwnershipType | "">(
    "",
  );
  const [serviceType, setServiceType] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: VehicleAction;
    vehicle: VehicleRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadVehicles() {
    setLoading(true);
    setError(null);
    try {
      const response = await vehiclesApi.search({
        keyword,
        status,
        ownershipType,
        serviceType,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Vehicles could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVehicles();
  }, [keyword, ownershipType, page, serviceType, size, status]);

  async function handleSubmit(payload: VehiclePayload) {
    setSaving(true);
    try {
      if (selectedVehicle) {
        await vehiclesApi.update(selectedVehicle.id, payload);
        showSuccess("Vehicle updated successfully.");
      } else {
        await vehiclesApi.create(payload);
        showSuccess("Vehicle created successfully.");
      }
      setDialogOpen(false);
      setSelectedVehicle(null);
      await loadVehicles();
    } catch {
      showError("Vehicle changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVehicleAction() {
    if (!actionState) {
      return;
    }

    setActionLoading(true);
    try {
      switch (actionState.type) {
        case "activate":
          await vehiclesApi.activate(actionState.vehicle.id);
          break;
        case "suspend":
          await vehiclesApi.suspend(actionState.vehicle.id);
          break;
        case "maintenance":
          await vehiclesApi.markMaintenance(actionState.vehicle.id);
          break;
        case "out-of-service":
          await vehiclesApi.markOutOfService(actionState.vehicle.id);
          break;
      }
      showSuccess("Vehicle status updated successfully.");
      setActionState(null);
      await loadVehicles();
    } catch {
      showError("The vehicle action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  function actionTitle(type: VehicleAction) {
    switch (type) {
      case "activate":
        return "Activate Vehicle";
      case "suspend":
        return "Suspend Vehicle";
      case "maintenance":
        return "Mark as Maintenance";
      case "out-of-service":
        return "Mark Out of Service";
    }
  }

  function actionDescription(action: {
    type: VehicleAction;
    vehicle: VehicleRecord;
  }) {
    const label = `${action.vehicle.make} ${action.vehicle.model} (${action.vehicle.vehicleCode})`;
    switch (action.type) {
      case "activate":
        return `Activate ${label} so it can become assignable in future operational workflows.`;
      case "suspend":
        return `Suspend ${label} to pause operational readiness until it is explicitly reactivated.`;
      case "maintenance":
        return `Move ${label} into maintenance so it is clearly excluded from future assignment decisions.`;
      case "out-of-service":
        return `Mark ${label} out of service because it is not currently eligible for operational use.`;
    }
  }

  function renderActions(vehicle: VehicleRecord) {
    if (vehicle.status === "ACTIVE") {
      return (
        <>
          <TableActionButton
            title="View Details"
            onClick={() => navigate(`/company/vehicles/${vehicle.id}`)}
          >
            <VisibilityRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Edit Vehicle"
            onClick={() => {
              setSelectedVehicle(vehicle);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Mark as Maintenance"
            onClick={() => setActionState({ type: "maintenance", vehicle })}
          >
            <BuildCircleRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Suspend Vehicle"
            onClick={() => setActionState({ type: "suspend", vehicle })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    if (vehicle.status === "MAINTENANCE") {
      return (
        <>
          <TableActionButton
            title="View Details"
            onClick={() => navigate(`/company/vehicles/${vehicle.id}`)}
          >
            <VisibilityRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Activate Vehicle"
            onClick={() => setActionState({ type: "activate", vehicle })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Mark Out of Service"
            onClick={() => setActionState({ type: "out-of-service", vehicle })}
          >
            <BlockRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    if (vehicle.status === "OUT_OF_SERVICE" || vehicle.status === "SUSPENDED") {
      return (
        <>
          <TableActionButton
            title="View Details"
            onClick={() => navigate(`/company/vehicles/${vehicle.id}`)}
          >
            <VisibilityRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Activate Vehicle"
            onClick={() => setActionState({ type: "activate", vehicle })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    return (
      <>
        <TableActionButton
          title="View Details"
          onClick={() => navigate(`/company/vehicles/${vehicle.id}`)}
        >
          <VisibilityRoundedIcon />
        </TableActionButton>
        <TableActionButton
          title="Edit Vehicle"
          onClick={() => {
            setSelectedVehicle(vehicle);
            setDialogOpen(true);
          }}
        >
          <EditRoundedIcon />
        </TableActionButton>
        <TableActionButton
          title="Activate Vehicle"
          onClick={() => setActionState({ type: "activate", vehicle })}
        >
          <PlayCircleRoundedIcon />
        </TableActionButton>
      </>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Administration"
        title="Vehicle Management"
        description="Manage vehicle onboarding, lifecycle readiness, document compliance, and future assignment readiness for your tenant."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedVehicle(null);
            setDialogOpen(true);
          }}
        >
          Create Vehicle
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by vehicle code, make, model, VIN, or plate number"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
        />
        <TextField
          label="Status"
          select
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value as VehicleStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          {vehicleStatuses.map((value) => (
            <MenuItem key={value || "all-statuses"} value={value}>
              {value ? value.replaceAll("_", " ") : "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Ownership Type"
          select
          value={ownershipType}
          onChange={(event) => {
            setPage(0);
            setOwnershipType(event.target.value as VehicleOwnershipType | "");
          }}
          sx={{ minWidth: 200 }}
        >
          {ownershipTypes.map((value) => (
            <MenuItem key={value || "all-ownership-types"} value={value}>
              {value ? value.replaceAll("_", " ") : "All ownership types"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Service Type"
          select
          value={serviceType}
          onChange={(event) => {
            setPage(0);
            setServiceType(event.target.value);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All service types</MenuItem>
          {vehicleServiceTypeOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Adjust the search criteria or create a new vehicle to get started."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle Code</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Plate Number</TableCell>
                    <TableCell>Ownership Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Insurance Expiry</TableCell>
                    <TableCell>Registration Expiry</TableCell>
                    <TableCell>Inspection Expiry</TableCell>
                    <TableCell>Compliance</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((vehicle) => (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>{vehicle.vehicleCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicle.make} {vehicle.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.year}
                          {vehicle.color ? ` • ${vehicle.color}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {vehicle.plateNumber} {vehicle.plateState}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={vehicle.ownershipType} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicle.capacity} seats
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Wheelchair: {vehicle.wheelchairCapacity ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip value={vehicle.status} />
                      </TableCell>
                      <TableCell>
                        {formatDate(vehicle.insuranceExpiryDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(vehicle.registrationExpiryDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(vehicle.inspectionExpiryDate)}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.75} alignItems="flex-start">
                          <StatusChip
                            value={vehicle.complianceSummary.overallStatus}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Missing required documents:{" "}
                            {
                              vehicle.complianceSummary
                                .missingRequiredDocumentCount
                            }
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicle.updatedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(vehicle.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {renderActions(vehicle)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={size}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </>
        )}
      </PageCard>

      <VehicleUpsertDialog
        open={dialogOpen}
        vehicle={selectedVehicle}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedVehicle(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={
          actionState ? actionTitle(actionState.type) : "Confirm Vehicle Action"
        }
        description={actionState ? actionDescription(actionState) : ""}
        confirmLabel={actionState ? actionTitle(actionState.type) : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleVehicleAction()}
      />
    </Stack>
  );
}
