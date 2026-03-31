import {
  Alert,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
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
  driversApi,
  type DriverPayload,
  type DriverRecord,
  type DriverStatus,
  type DriverType,
} from "../api/driversApi";
import { DriverUpsertDialog } from "../components/DriverUpsertDialog";

const driverStatuses: Array<DriverStatus | ""> = [
  "",
  "APPLIED",
  "PENDING_REVIEW",
  "DOCUMENT_PENDING",
  "TRAINING_PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "TERMINATED",
];
const driverTypes: Array<DriverType | ""> = ["", "EMPLOYEE", "CONTRACTOR"];

type DriverAction =
  | "review"
  | "documents-complete"
  | "activate"
  | "suspend"
  | "deactivate"
  | "terminate";

export function DriverManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<DriverRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DriverStatus | "">("");
  const [driverType, setDriverType] = useState<DriverType | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: DriverAction;
    driver: DriverRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadDrivers() {
    setLoading(true);
    setError(null);
    try {
      const response = await driversApi.search({
        keyword,
        status,
        driverType,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Drivers could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDrivers();
  }, [keyword, status, driverType, page, size]);

  async function handleSubmit(payload: DriverPayload) {
    setSaving(true);
    try {
      if (selectedDriver) {
        await driversApi.update(selectedDriver.id, payload);
        showSuccess("Driver updated successfully.");
      } else {
        await driversApi.create(payload);
        showSuccess("Driver created successfully.");
      }
      setDialogOpen(false);
      setSelectedDriver(null);
      await loadDrivers();
    } catch {
      showError("Driver changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDriverAction() {
    if (!actionState) {
      return;
    }

    setActionLoading(true);
    try {
      switch (actionState.type) {
        case "review":
          await driversApi.review(actionState.driver.id);
          break;
        case "documents-complete":
          await driversApi.completeDocuments(actionState.driver.id);
          break;
        case "activate":
          await driversApi.activate(actionState.driver.id);
          break;
        case "suspend":
          await driversApi.suspend(actionState.driver.id);
          break;
        case "deactivate":
          await driversApi.deactivate(actionState.driver.id);
          break;
        case "terminate":
          await driversApi.terminate(actionState.driver.id);
          break;
      }
      showSuccess("Driver status updated successfully.");
      setActionState(null);
      await loadDrivers();
    } catch {
      showError("The driver action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  function actionTitle(type: DriverAction) {
    switch (type) {
      case "review":
        return "Review Driver";
      case "documents-complete":
        return "Complete Document Review";
      case "activate":
        return "Activate Driver";
      case "suspend":
        return "Suspend Driver";
      case "deactivate":
        return "Mark Driver Inactive";
      case "terminate":
        return "Terminate Driver";
    }
  }

  function actionDescription(action: {
    type: DriverAction;
    driver: DriverRecord;
  }) {
    const label = `${action.driver.firstName} ${action.driver.lastName}`;
    switch (action.type) {
      case "review":
        return `Move ${label} into the document collection stage.`;
      case "documents-complete":
        return `Mark ${label}'s required documents complete and move onboarding forward.`;
      case "activate":
        return `Activate ${label} so the driver can become assignable in future workflows.`;
      case "suspend":
        return `Suspend ${label} to pause operational readiness until reactivated.`;
      case "deactivate":
        return `Mark ${label} inactive while preserving the driver record.`;
      case "terminate":
        return `Terminate ${label}. This is intended for drivers who should remain view-only going forward.`;
    }
  }

  function renderActions(driver: DriverRecord) {
    if (driver.status === "APPLIED" || driver.status === "PENDING_REVIEW") {
      return (
        <>
          <TableActionButton
            title="Review Driver"
            onClick={() => setActionState({ type: "review", driver })}
          >
            <AssignmentTurnedInRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Edit Driver"
            onClick={() => {
              setSelectedDriver(driver);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Suspend Driver"
            onClick={() => setActionState({ type: "suspend", driver })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    if (driver.status === "DOCUMENT_PENDING") {
      return (
        <>
          <TableActionButton
            title="Manage Documents"
            onClick={() => navigate(`/company/drivers/${driver.id}`)}
          >
            <DescriptionRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Edit Driver"
            onClick={() => {
              setSelectedDriver(driver);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Suspend Driver"
            onClick={() => setActionState({ type: "suspend", driver })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    if (driver.status === "TRAINING_PENDING") {
      return (
        <>
          <TableActionButton
            title="Activate Driver"
            onClick={() => setActionState({ type: "activate", driver })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Edit Driver"
            onClick={() => {
              setSelectedDriver(driver);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Suspend Driver"
            onClick={() => setActionState({ type: "suspend", driver })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    if (driver.status === "ACTIVE") {
      return (
        <>
          <TableActionButton
            title="View Details"
            onClick={() => navigate(`/company/drivers/${driver.id}`)}
          >
            <VisibilityRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Edit Driver"
            onClick={() => {
              setSelectedDriver(driver);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Suspend Driver"
            onClick={() => setActionState({ type: "suspend", driver })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    if (driver.status === "SUSPENDED" || driver.status === "INACTIVE") {
      return (
        <>
          <TableActionButton
            title="View Details"
            onClick={() => navigate(`/company/drivers/${driver.id}`)}
          >
            <VisibilityRoundedIcon />
          </TableActionButton>
          <TableActionButton
            title="Activate Driver"
            onClick={() => setActionState({ type: "activate", driver })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
        </>
      );
    }

    return (
      <TableActionButton
        title="View Details"
        onClick={() => navigate(`/company/drivers/${driver.id}`)}
      >
        <VisibilityRoundedIcon />
      </TableActionButton>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Administration"
        title="Driver Management"
        description="Manage driver onboarding, readiness, lifecycle controls, and document compliance for your tenant."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedDriver(null);
            setDialogOpen(true);
          }}
        >
          Create Driver
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by driver code, name, email, phone, or license number"
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
            setStatus(event.target.value as DriverStatus | "");
          }}
          sx={{ minWidth: 200 }}
        >
          {driverStatuses.map((value) => (
            <MenuItem key={value || "all-statuses"} value={value}>
              {value ? value.replaceAll("_", " ") : "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Driver Type"
          select
          value={driverType}
          onChange={(event) => {
            setPage(0);
            setDriverType(event.target.value as DriverType | "");
          }}
          sx={{ minWidth: 180 }}
        >
          {driverTypes.map((value) => (
            <MenuItem key={value || "all-types"} value={value}>
              {value ? value.replaceAll("_", " ") : "All types"}
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
            description="Adjust the search criteria or create a new driver to get started."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Driver Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Driver Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>License Expiry</TableCell>
                    <TableCell>Compliance</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((driver) => (
                    <TableRow key={driver.id} hover>
                      <TableCell>{driver.driverCode}</TableCell>
                      <TableCell>
                        {driver.firstName} {driver.lastName}
                      </TableCell>
                      <TableCell>{driver.email || "-"}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>
                        {driver.driverType.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={driver.status} />
                      </TableCell>
                      <TableCell>{driver.licenseExpiryDate || "-"}</TableCell>
                      <TableCell>
                        <Stack spacing={0.75} alignItems="flex-start">
                          <StatusChip
                            value={driver.complianceSummary.overallStatus}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Missing required documents:{" "}
                            {
                              driver.complianceSummary
                                .missingRequiredDocumentCount
                            }
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {driver.createdBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(driver.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {driver.updatedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(driver.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {renderActions(driver)}
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

      <DriverUpsertDialog
        open={dialogOpen}
        driver={selectedDriver}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedDriver(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={
          actionState ? actionTitle(actionState.type) : "Confirm Driver Action"
        }
        description={actionState ? actionDescription(actionState) : ""}
        confirmLabel={actionState ? actionTitle(actionState.type) : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleDriverAction()}
      />
    </Stack>
  );
}
