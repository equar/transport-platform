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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WheelchairPickupRoundedIcon from "@mui/icons-material/WheelchairPickupRounded";
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
import { normalizeBusinessError } from "../../../shared/api/businessError";
import {
  riderTypeOptions,
  ridersApi,
  type RiderPayload,
  type RiderRecord,
  type RiderStatus,
  type RiderType,
} from "../api/ridersApi";
import { RiderUpsertDialog } from "../components/RiderUpsertDialog";

const riderStatuses: Array<RiderStatus | ""> = [
  "",
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "WAITLISTED",
];

type RiderAction = "activate" | "suspend" | "waitlist" | "deactivate";

function booleanFilterLabel(value: boolean | "") {
  if (value === "") {
    return "All";
  }
  return value ? "Yes" : "No";
}

export function RiderManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<RiderRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RiderStatus | "">("");
  const [riderType, setRiderType] = useState<RiderType | "">("");
  const [wheelchairRequired, setWheelchairRequired] = useState<boolean | "">(
    "",
  );
  const [escortRequired, setEscortRequired] = useState<boolean | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<RiderRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: RiderAction;
    rider: RiderRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadRiders() {
    setLoading(true);
    setError(null);
    try {
      const response = await ridersApi.search({
        keyword,
        status,
        riderType,
        wheelchairRequired,
        escortRequired,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Riders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRiders();
  }, [
    keyword,
    status,
    riderType,
    wheelchairRequired,
    escortRequired,
    page,
    size,
  ]);

  async function handleSubmit(payload: RiderPayload) {
    setSaving(true);
    try {
      if (selectedRider) {
        await ridersApi.update(selectedRider.id, payload);
        showSuccess("Rider updated successfully.");
      } else {
        await ridersApi.create(payload);
        showSuccess("Rider created successfully.");
      }
      setDialogOpen(false);
      setSelectedRider(null);
      await loadRiders();
    } catch (saveError) {
      showError(
        normalizeBusinessError(
          saveError,
          "Rider changes could not be saved.",
        ).message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRiderAction() {
    if (!actionState) {
      return;
    }
    setActionLoading(true);
    try {
      switch (actionState.type) {
        case "activate":
          await ridersApi.activate(actionState.rider.id);
          break;
        case "suspend":
          await ridersApi.suspend(actionState.rider.id);
          break;
        case "waitlist":
          await ridersApi.waitlist(actionState.rider.id);
          break;
        case "deactivate":
          await ridersApi.deactivate(actionState.rider.id);
          break;
      }
      showSuccess("Rider status updated successfully.");
      setActionState(null);
      await loadRiders();
    } catch {
      showError("The rider action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  function actionTitle(type: RiderAction) {
    switch (type) {
      case "activate":
        return "Activate Rider";
      case "suspend":
        return "Suspend Rider";
      case "waitlist":
        return "Move Rider to Waitlist";
      case "deactivate":
        return "Mark Rider Inactive";
    }
  }

  function renderActions(rider: RiderRecord) {
    return (
      <>
        <TableActionButton
          title="View Details"
          onClick={() => navigate(`/company/riders/${rider.id}`)}
        >
          <VisibilityRoundedIcon />
        </TableActionButton>
        {rider.status !== "SUSPENDED" && rider.status !== "INACTIVE" ? (
          <TableActionButton
            title="Edit Rider"
            onClick={() => {
              setSelectedRider(rider);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
        ) : null}
        {rider.status === "PENDING" ||
        rider.status === "SUSPENDED" ||
        rider.status === "WAITLISTED" ||
        rider.status === "INACTIVE" ? (
          <TableActionButton
            title="Activate Rider"
            onClick={() => setActionState({ type: "activate", rider })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
        ) : null}
        {rider.status === "PENDING" || rider.status === "ACTIVE" ? (
          <TableActionButton
            title="Suspend Rider"
            onClick={() => setActionState({ type: "suspend", rider })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        ) : null}
        {rider.status === "PENDING" ||
        rider.status === "ACTIVE" ||
        rider.status === "SUSPENDED" ? (
          <TableActionButton
            title="Move to Waitlist"
            onClick={() => setActionState({ type: "waitlist", rider })}
          >
            <HourglassBottomRoundedIcon />
          </TableActionButton>
        ) : null}
        {rider.status !== "INACTIVE" ? (
          <TableActionButton
            title="Mark Inactive"
            onClick={() => setActionState({ type: "deactivate", rider })}
          >
            <PersonOffRoundedIcon />
          </TableActionButton>
        ) : null}
      </>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Administration"
        title="Rider Management"
        description="Manage rider onboarding, support needs, guardian visibility, and future scheduling readiness for your tenant."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedRider(null);
            setDialogOpen(true);
          }}
        >
          Create Rider
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by rider code, name, email, or phone"
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
            setStatus(event.target.value as RiderStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          {riderStatuses.map((value) => (
            <MenuItem key={value || "all-statuses"} value={value}>
              {value ? value.replaceAll("_", " ") : "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Rider Type"
          select
          value={riderType}
          onChange={(event) => {
            setPage(0);
            setRiderType(event.target.value as RiderType | "");
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All rider types</MenuItem>
          {riderTypeOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Wheelchair Required"
          select
          value={wheelchairRequired === "" ? "" : String(wheelchairRequired)}
          onChange={(event) => {
            setPage(0);
            setWheelchairRequired(
              event.target.value === "" ? "" : event.target.value === "true",
            );
          }}
          sx={{ minWidth: 180 }}
        >
          {["", "true", "false"].map((value) => (
            <MenuItem key={value || "all-wheelchair"} value={value}>
              {booleanFilterLabel(value === "" ? "" : value === "true")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Escort Required"
          select
          value={escortRequired === "" ? "" : String(escortRequired)}
          onChange={(event) => {
            setPage(0);
            setEscortRequired(
              event.target.value === "" ? "" : event.target.value === "true",
            );
          }}
          sx={{ minWidth: 180 }}
        >
          {["", "true", "false"].map((value) => (
            <MenuItem key={value || "all-escort"} value={value}>
              {booleanFilterLabel(value === "" ? "" : value === "true")}
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
            description="Adjust the search criteria or create a new rider to get started."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rider Code</TableCell>
                    <TableCell>Rider</TableCell>
                    <TableCell>Primary Phone</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Support Needs</TableCell>
                    <TableCell>Primary Guardian</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((rider) => (
                    <TableRow key={rider.id} hover>
                      <TableCell>{rider.riderCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {rider.firstName} {rider.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rider.riderType.replaceAll("_", " ")}
                        </Typography>
                      </TableCell>
                      <TableCell>{rider.primaryPhone}</TableCell>
                      <TableCell>{rider.city || "-"}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          {rider.wheelchairRequired ? (
                            <StatusChip value="WHEELCHAIR" />
                          ) : null}
                          {rider.escortRequired ? (
                            <StatusChip value="ESCORT_REQUIRED" />
                          ) : null}
                          {!rider.wheelchairRequired &&
                          !rider.escortRequired ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Standard support profile
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {rider.primaryGuardian ? (
                          <Stack spacing={0.25}>
                            <Typography variant="body2">
                              {rider.primaryGuardian.guardianDisplayName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {rider.primaryGuardian.relationshipType.replaceAll(
                                "_",
                                " ",
                              )}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No primary guardian
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={rider.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {rider.updatedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(rider.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {renderActions(rider)}
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

      <RiderUpsertDialog
        open={dialogOpen}
        rider={selectedRider}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedRider(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={
          actionState ? actionTitle(actionState.type) : "Confirm Rider Action"
        }
        description={
          actionState
            ? `Apply the ${actionState.type} action to ${actionState.rider.firstName} ${actionState.rider.lastName} (${actionState.rider.riderCode})?`
            : ""
        }
        confirmLabel={actionState ? actionTitle(actionState.type) : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleRiderAction()}
      />
    </Stack>
  );
}
