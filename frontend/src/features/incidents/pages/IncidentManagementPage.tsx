import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GppMaybeRoundedIcon from "@mui/icons-material/GppMaybeRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Button,
  Drawer,
  MenuItem,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useEffect, useMemo, useState } from "react";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  incidentSeverityOptions,
  incidentsApi,
  incidentStatusOptions,
  incidentTypeOptions,
  type IncidentDetailRecord,
  type IncidentReferenceData,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentStatusActionPayload,
  type IncidentSummaryRecord,
  type IncidentType,
} from "../api/incidentsApi";
import { IncidentUpsertDialog } from "../components/IncidentUpsertDialog";

type IncidentAction =
  | "in-review"
  | "escalate"
  | "resolve"
  | "close"
  | "dismiss"
  | "reopen";

const actionLabels: Record<IncidentAction, string> = {
  "in-review": "Move To In Review",
  escalate: "Escalate Incident",
  resolve: "Resolve Incident",
  close: "Close Incident",
  dismiss: "Dismiss Incident",
  reopen: "Reopen Incident",
};

function relatedReference(
  record: IncidentSummaryRecord | IncidentDetailRecord,
) {
  return (
    record.relatedRideCode ??
    record.relatedDriverCode ??
    record.relatedVehicleCode ??
    record.relatedRiderCode ??
    record.relatedOrganizationName ??
    "-"
  );
}

function availableActions(status: IncidentStatus): IncidentAction[] {
  switch (status) {
    case "OPEN":
      return ["in-review", "escalate", "dismiss"];
    case "IN_REVIEW":
      return ["resolve", "escalate", "dismiss"];
    case "ESCALATED":
      return ["resolve", "close", "dismiss"];
    case "RESOLVED":
      return ["close", "reopen"];
    case "CLOSED":
    case "DISMISSED":
      return ["reopen"];
    default:
      return [];
  }
}

function requiresResolution(action: IncidentAction) {
  return action === "resolve";
}

function defaultActionPayload(
  detail: IncidentDetailRecord | null,
): IncidentStatusActionPayload {
  return {
    resolutionSummary: detail?.resolutionSummary ?? "",
    rootCauseSummary: detail?.rootCauseSummary ?? "",
    correctiveActionSummary: detail?.correctiveActionSummary ?? "",
    notes: detail?.notes ?? "",
  };
}

export function IncidentManagementPage() {
  const { showError, showSuccess } = useToast();
  const [referenceData, setReferenceData] =
    useState<IncidentReferenceData | null>(null);
  const [items, setItems] = useState<IncidentSummaryRecord[]>([]);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentDetailRecord | null>(null);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "">("");
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [assignedToUserId, setAssignedToUserId] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] =
    useState<IncidentDetailRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: IncidentAction;
    incident: IncidentDetailRecord;
  } | null>(null);
  const [actionPayload, setActionPayload] =
    useState<IncidentStatusActionPayload>(defaultActionPayload(null));
  const [actionLoading, setActionLoading] = useState(false);

  const metrics = useMemo(() => {
    const openCount = items.filter((item) =>
      ["OPEN", "IN_REVIEW", "ESCALATED"].includes(item.status),
    ).length;
    const criticalCount = items.filter(
      (item) => item.severity === "CRITICAL",
    ).length;
    const resolvedCount = items.filter(
      (item) => item.status === "RESOLVED",
    ).length;
    return { openCount, criticalCount, resolvedCount };
  }, [items]);

  async function loadReferenceData() {
    try {
      const response = await incidentsApi.getReferenceData();
      setReferenceData(response);
    } catch {
      showError("Incident reference data could not be loaded.");
    }
  }

  async function loadIncidents() {
    setLoading(true);
    setError(null);
    try {
      const response = await incidentsApi.search({
        keyword,
        status,
        severity,
        incidentType,
        assignedToUserId: assignedToUserId ? Number(assignedToUserId) : null,
        fromDate,
        toDate,
        page,
        size,
        sortBy: "reportedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Incidents could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReferenceData();
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [
    assignedToUserId,
    fromDate,
    incidentType,
    keyword,
    page,
    severity,
    size,
    status,
    toDate,
  ]);

  async function openIncident(incidentId: number) {
    try {
      const response = await incidentsApi.getById(incidentId);
      setSelectedIncident(response);
      return response;
    } catch {
      showError("Incident details could not be loaded.");
      return null;
    }
  }

  async function handleIncidentSubmit(
    payload: Parameters<typeof incidentsApi.create>[0],
  ) {
    setSaving(true);
    try {
      if (editingIncident) {
        const response = await incidentsApi.update(editingIncident.id, payload);
        setSelectedIncident(response);
        showSuccess("Incident updated successfully.");
      } else {
        const response = await incidentsApi.create(payload);
        setSelectedIncident(response);
        showSuccess("Incident created successfully.");
      }
      setDialogOpen(false);
      setEditingIncident(null);
      await loadIncidents();
    } catch {
      showError("Incident changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function beginEdit(
    record: IncidentSummaryRecord | IncidentDetailRecord,
  ) {
    const detail =
      "description" in record ? record : await openIncident(record.id);
    if (!detail) {
      return;
    }
    setEditingIncident(detail);
    setDialogOpen(true);
  }

  async function openAction(
    type: IncidentAction,
    record: IncidentSummaryRecord | IncidentDetailRecord,
  ) {
    const detail =
      "description" in record ? record : await openIncident(record.id);
    if (!detail) {
      return;
    }
    setActionPayload(defaultActionPayload(detail));
    setActionState({ type, incident: detail });
  }

  async function handleAction() {
    if (!actionState) {
      return;
    }

    if (
      requiresResolution(actionState.type) &&
      !actionPayload.resolutionSummary?.trim()
    ) {
      showError("Resolution summary is required before resolving an incident.");
      return;
    }

    setActionLoading(true);
    try {
      const { incident, type } = actionState;
      const response =
        type === "in-review"
          ? await incidentsApi.moveToInReview(incident.id, actionPayload)
          : type === "escalate"
            ? await incidentsApi.escalate(incident.id, actionPayload)
            : type === "resolve"
              ? await incidentsApi.resolve(incident.id, actionPayload)
              : type === "close"
                ? await incidentsApi.close(incident.id, actionPayload)
                : type === "dismiss"
                  ? await incidentsApi.dismiss(incident.id, actionPayload)
                  : await incidentsApi.reopen(incident.id, actionPayload);

      setSelectedIncident(response);
      setActionState(null);
      showSuccess(
        `Incident ${type.replaceAll("-", " ")} completed successfully.`,
      );
      await loadIncidents();
    } catch {
      showError("Incident workflow action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Batch 6B"
        title="Incident Management"
        description="Track complaints, safety events, and operational escalations with tenant-safe workflow control, ownership, and follow-up detail."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setEditingIncident(null);
            setDialogOpen(true);
          }}
        >
          Create Incident
        </Button>
      </SectionHeader>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <MetricCard
          icon={<ReportProblemRoundedIcon color="primary" />}
          label="Open Incidents"
          value={metrics.openCount}
          caption="Open, in-review, and escalated incidents still waiting for final closure."
        />
        <MetricCard
          icon={<LocalFireDepartmentRoundedIcon color="primary" />}
          label="Critical Incidents"
          value={metrics.criticalCount}
          caption="Highest-severity incidents requiring direct operational attention."
        />
        <MetricCard
          icon={<CheckCircleRoundedIcon color="primary" />}
          label="Resolved Incidents"
          value={metrics.resolvedCount}
          caption="Incidents with documented resolution that still need closure or review."
        />
      </Stack>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by code, title, or assignee"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
          fullWidth
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value as IncidentStatus | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All States</MenuItem>
          {incidentStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Severity"
          value={severity}
          onChange={(event) => {
            setPage(0);
            setSeverity(event.target.value as IncidentSeverity | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All Severity</MenuItem>
          {incidentSeverityOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Type"
          value={incidentType}
          onChange={(event) => {
            setPage(0);
            setIncidentType(event.target.value as IncidentType | "");
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All Types</MenuItem>
          {incidentTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Assigned To"
          value={assignedToUserId}
          onChange={(event) => {
            setPage(0);
            setAssignedToUserId(event.target.value);
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All Assignees</MenuItem>
          {(referenceData?.users ?? []).map((option) => (
            <MenuItem key={option.id} value={String(option.id)}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="From"
          type="date"
          value={fromDate}
          onChange={(event) => {
            setPage(0);
            setFromDate(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="To"
          type="date"
          value={toDate}
          onChange={(event) => {
            setPage(0);
            setToDate(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No incidents found"
            description="Complaints, safety events, and exception-driven follow-up will appear here once your operators start recording them."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Incident</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Related</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.incidentCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.reportedByNameSnapshot ?? "Unknown reporter"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {item.incidentType.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <StatusChip value={item.severity} />
                    </TableCell>
                    <TableCell>{item.assignedToName ?? "Unassigned"}</TableCell>
                    <TableCell>{relatedReference(item)}</TableCell>
                    <TableCell>
                      <StatusChip value={item.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(item.reportedAt)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <TableActionButton
                          title="View"
                          onClick={() => void openIncident(item.id)}
                        >
                          <VisibilityRoundedIcon fontSize="small" />
                        </TableActionButton>
                        <TableActionButton
                          title="Edit"
                          onClick={() => void beginEdit(item)}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </TableActionButton>
                        {availableActions(item.status)
                          .slice(0, 1)
                          .map((action) => (
                            <TableActionButton
                              key={action}
                              title={actionLabels[action]}
                              onClick={() => void openAction(action, item)}
                            >
                              <RuleRoundedIcon fontSize="small" />
                            </TableActionButton>
                          ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={size}
              onRowsPerPageChange={(event) => {
                setPage(0);
                setSize(Number(event.target.value));
              }}
            />
          </>
        )}
      </PageCard>

      <Drawer
        anchor="right"
        open={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
      >
        <Stack spacing={2.5} sx={{ width: { xs: "100vw", sm: 520 }, p: 3 }}>
          {selectedIncident ? (
            <>
              <Stack spacing={1}>
                <Typography variant="overline" color="secondary.main">
                  Incident Detail
                </Typography>
                <Typography variant="h4">{selectedIncident.title}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <StatusChip value={selectedIncident.status} />
                  <StatusChip value={selectedIncident.severity} />
                </Stack>
                <Typography color="text.secondary">
                  {selectedIncident.incidentCode} •{" "}
                  {selectedIncident.incidentType.replaceAll("_", " ")}
                </Typography>
              </Stack>

              <PageCard>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Description</Typography>
                  <Typography color="text.secondary">
                    {selectedIncident.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reported {formatDateTime(selectedIncident.reportedAt)} by{" "}
                    {selectedIncident.reportedByNameSnapshot ??
                      "Unknown reporter"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned to{" "}
                    {selectedIncident.assignedToName ?? "Unassigned"}
                  </Typography>
                </Stack>
              </PageCard>

              <PageCard>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Linked Records</Typography>
                  <Typography color="text.secondary">
                    Ride: {selectedIncident.relatedRideCode ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Driver: {selectedIncident.relatedDriverCode ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Vehicle: {selectedIncident.relatedVehicleCode ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Rider: {selectedIncident.relatedRiderCode ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Guardian: {selectedIncident.relatedGuardianName ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Organization:{" "}
                    {selectedIncident.relatedOrganizationName ?? "-"}
                  </Typography>
                </Stack>
              </PageCard>

              <PageCard>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Resolution Notes</Typography>
                  <Typography color="text.secondary">
                    Resolution: {selectedIncident.resolutionSummary ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Root cause: {selectedIncident.rootCauseSummary ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Corrective action:{" "}
                    {selectedIncident.correctiveActionSummary ?? "-"}
                  </Typography>
                  <Typography color="text.secondary">
                    Notes: {selectedIncident.notes ?? "-"}
                  </Typography>
                </Stack>
              </PageCard>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                flexWrap="wrap"
              >
                <Button
                  variant="contained"
                  startIcon={<EditRoundedIcon />}
                  onClick={() => void beginEdit(selectedIncident)}
                >
                  Edit Incident
                </Button>
                {availableActions(selectedIncident.status).map((action) => (
                  <Button
                    key={action}
                    variant={
                      action === "resolve" || action === "close"
                        ? "outlined"
                        : "text"
                    }
                    startIcon={
                      action === "resolve" ? (
                        <CheckCircleRoundedIcon />
                      ) : action === "escalate" ? (
                        <WarningAmberRoundedIcon />
                      ) : action === "reopen" ? (
                        <RestartAltRoundedIcon />
                      ) : action === "dismiss" ? (
                        <GppMaybeRoundedIcon />
                      ) : (
                        <AssignmentTurnedInRoundedIcon />
                      )
                    }
                    onClick={() => void openAction(action, selectedIncident)}
                  >
                    {actionLabels[action]}
                  </Button>
                ))}
              </Stack>
            </>
          ) : null}
        </Stack>
      </Drawer>

      <IncidentUpsertDialog
        open={dialogOpen}
        incident={editingIncident}
        referenceData={referenceData}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setEditingIncident(null);
        }}
        onSubmit={handleIncidentSubmit}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={actionState ? actionLabels[actionState.type] : "Update Incident"}
        description="Capture the workflow notes needed for auditability before changing the incident state."
        confirmLabel={actionState ? actionLabels[actionState.type] : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={() => void handleAction()}
      >
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Resolution Summary"
            value={actionPayload.resolutionSummary ?? ""}
            onChange={(event) =>
              setActionPayload((current) => ({
                ...current,
                resolutionSummary: event.target.value,
              }))
            }
            required={Boolean(
              actionState && requiresResolution(actionState.type),
            )}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Root Cause Summary"
            value={actionPayload.rootCauseSummary ?? ""}
            onChange={(event) =>
              setActionPayload((current) => ({
                ...current,
                rootCauseSummary: event.target.value,
              }))
            }
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Corrective Action Summary"
            value={actionPayload.correctiveActionSummary ?? ""}
            onChange={(event) =>
              setActionPayload((current) => ({
                ...current,
                correctiveActionSummary: event.target.value,
              }))
            }
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Notes"
            value={actionPayload.notes ?? ""}
            onChange={(event) =>
              setActionPayload((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </ConfirmDialog>
    </Stack>
  );
}
