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
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
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
  guardiansApi,
  type GuardianPayload,
  type GuardianRecord,
  type GuardianStatus,
} from "../api/guardiansApi";
import { GuardianUpsertDialog } from "../components/GuardianUpsertDialog";

const guardianStatuses: Array<GuardianStatus | ""> = [
  "",
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
];

type GuardianAction = "activate" | "suspend" | "deactivate";

function booleanFilterLabel(value: boolean | "") {
  if (value === "") {
    return "All";
  }
  return value ? "Yes" : "No";
}

export function GuardianManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<GuardianRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<GuardianStatus | "">("");
  const [authorizedForPickup, setAuthorizedForPickup] = useState<boolean | "">(
    "",
  );
  const [billingContact, setBillingContact] = useState<boolean | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] =
    useState<GuardianRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: GuardianAction;
    guardian: GuardianRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadGuardians() {
    setLoading(true);
    setError(null);
    try {
      const response = await guardiansApi.search({
        keyword,
        status,
        authorizedForPickup,
        billingContact,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Guardians could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGuardians();
  }, [keyword, status, authorizedForPickup, billingContact, page, size]);

  async function handleSubmit(payload: GuardianPayload) {
    setSaving(true);
    try {
      if (selectedGuardian) {
        await guardiansApi.update(selectedGuardian.id, payload);
        showSuccess("Guardian updated successfully.");
      } else {
        await guardiansApi.create(payload);
        showSuccess("Guardian created successfully.");
      }
      setDialogOpen(false);
      setSelectedGuardian(null);
      await loadGuardians();
    } catch (saveError) {
      showError(
        normalizeBusinessError(
          saveError,
          "Guardian changes could not be saved.",
        ).message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGuardianAction() {
    if (!actionState) {
      return;
    }
    setActionLoading(true);
    try {
      switch (actionState.type) {
        case "activate":
          await guardiansApi.activate(actionState.guardian.id);
          break;
        case "suspend":
          await guardiansApi.suspend(actionState.guardian.id);
          break;
        case "deactivate":
          await guardiansApi.deactivate(actionState.guardian.id);
          break;
      }
      showSuccess("Guardian status updated successfully.");
      setActionState(null);
      await loadGuardians();
    } catch {
      showError("The guardian action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Company Administration"
        title="Guardian Management"
        description="Manage family contacts, communication preferences, pickup authorization, and billing contact visibility within your tenant."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedGuardian(null);
            setDialogOpen(true);
          }}
        >
          Create Guardian
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by name, email, or phone"
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
            setStatus(event.target.value as GuardianStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          {guardianStatuses.map((value) => (
            <MenuItem key={value || "all-statuses"} value={value}>
              {value ? value.replaceAll("_", " ") : "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Authorized for Pickup"
          select
          value={authorizedForPickup === "" ? "" : String(authorizedForPickup)}
          onChange={(event) => {
            setPage(0);
            setAuthorizedForPickup(
              event.target.value === "" ? "" : event.target.value === "true",
            );
          }}
          sx={{ minWidth: 180 }}
        >
          {["", "true", "false"].map((value) => (
            <MenuItem key={value || "all-authorized"} value={value}>
              {booleanFilterLabel(value === "" ? "" : value === "true")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Billing Contact"
          select
          value={billingContact === "" ? "" : String(billingContact)}
          onChange={(event) => {
            setPage(0);
            setBillingContact(
              event.target.value === "" ? "" : event.target.value === "true",
            );
          }}
          sx={{ minWidth: 160 }}
        >
          {["", "true", "false"].map((value) => (
            <MenuItem key={value || "all-billing"} value={value}>
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
            description="Adjust the search criteria or create a new guardian to get started."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Guardian</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Preferred Communication</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Linked Riders</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((guardian) => (
                    <TableRow key={guardian.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {guardian.firstName} {guardian.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {guardian.relationToRiderDefault ||
                            "No default relationship"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {guardian.phone}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {guardian.email || guardian.alternatePhone || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {guardian.preferredCommunicationMethod || "-"}
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          {guardian.authorizedForPickup ? (
                            <StatusChip value="AUTHORIZED_FOR_PICKUP" />
                          ) : null}
                          {guardian.billingContact ? (
                            <StatusChip value="BILLING_CONTACT" />
                          ) : null}
                          {!guardian.authorizedForPickup &&
                          !guardian.billingContact ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Standard contact
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{guardian.linkedRiderCount}</TableCell>
                      <TableCell>
                        <StatusChip value={guardian.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {guardian.updatedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(guardian.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TableActionButton
                          title="View Details"
                          onClick={() =>
                            navigate(`/company/guardians/${guardian.id}`)
                          }
                        >
                          <VisibilityRoundedIcon />
                        </TableActionButton>
                        {guardian.status !== "INACTIVE" ? (
                          <TableActionButton
                            title="Edit Guardian"
                            onClick={() => {
                              setSelectedGuardian(guardian);
                              setDialogOpen(true);
                            }}
                          >
                            <EditRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {guardian.status === "PENDING" ||
                        guardian.status === "SUSPENDED" ||
                        guardian.status === "INACTIVE" ? (
                          <TableActionButton
                            title="Activate Guardian"
                            onClick={() =>
                              setActionState({ type: "activate", guardian })
                            }
                          >
                            <PlayCircleRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {guardian.status === "PENDING" ||
                        guardian.status === "ACTIVE" ? (
                          <TableActionButton
                            title="Suspend Guardian"
                            onClick={() =>
                              setActionState({ type: "suspend", guardian })
                            }
                          >
                            <PauseCircleRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {guardian.status !== "INACTIVE" ? (
                          <TableActionButton
                            title="Mark Inactive"
                            onClick={() =>
                              setActionState({ type: "deactivate", guardian })
                            }
                          >
                            <PersonOffRoundedIcon />
                          </TableActionButton>
                        ) : null}
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

      <GuardianUpsertDialog
        open={dialogOpen}
        guardian={selectedGuardian}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedGuardian(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={
          actionState?.type === "activate"
            ? "Activate Guardian"
            : actionState?.type === "suspend"
              ? "Suspend Guardian"
              : "Mark Guardian Inactive"
        }
        description={
          actionState
            ? `Apply the ${actionState.type} action to ${actionState.guardian.firstName} ${actionState.guardian.lastName}?`
            : ""
        }
        confirmLabel={
          actionState?.type === "activate"
            ? "Activate Guardian"
            : actionState?.type === "suspend"
              ? "Suspend Guardian"
              : "Mark Inactive"
        }
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleGuardianAction()}
      />
    </Stack>
  );
}
