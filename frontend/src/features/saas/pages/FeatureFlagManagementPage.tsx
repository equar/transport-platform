import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { useEffect, useState } from "react";
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
import { tenantsApi, type Tenant } from "../../tenants/api/tenantsApi";
import {
  saasAdminApi,
  type FeatureFlagPayload,
  type FeatureFlagRecord,
} from "../api/saasAdminApi";

const featureFlagStatuses = ["", "ACTIVE", "INACTIVE"];
const moduleKeys = [
  "",
  "BILLING",
  "NOTIFICATIONS",
  "COMPLIANCE",
  "INCIDENTS",
  "REPORTS",
  "DISPATCH",
  "ROUTES",
  "RECURRING_RIDES",
  "PORTAL_DRIVER",
  "PORTAL_RIDER_GUARDIAN",
  "PORTAL_ORGANIZATION",
];

function createEmptyFeatureFlag(): FeatureFlagPayload {
  return {
    flagCode: "",
    name: "",
    description: "",
    moduleKey: "BILLING",
    enabledByDefault: true,
    platformManagedOnly: false,
    notes: "",
  };
}

export function FeatureFlagManagementPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<FeatureFlagRecord[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [moduleKey, setModuleKey] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagRecord | null>(
    null,
  );
  const [form, setForm] = useState<FeatureFlagPayload>(
    createEmptyFeatureFlag(),
  );
  const [actionFlag, setActionFlag] = useState<FeatureFlagRecord | null>(null);
  const [actionType, setActionType] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideTenantId, setOverrideTenantId] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [overrideNotes, setOverrideNotes] = useState("");

  async function loadTenants() {
    try {
      const response = await tenantsApi.search({
        keyword: "",
        status: "",
        page: 0,
        size: 200,
      });
      setTenants(response.items);
    } catch {
      setTenants([]);
    }
  }

  async function loadFeatureFlags() {
    setLoading(true);
    setError(null);
    try {
      const response = await saasAdminApi.searchFeatureFlags({
        keyword,
        status,
        moduleKey,
        page,
        size,
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Feature flags could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTenants();
  }, []);

  useEffect(() => {
    void loadFeatureFlags();
  }, [keyword, status, moduleKey, page, size]);

  function openCreateDialog() {
    setSelectedFlag(null);
    setForm(createEmptyFeatureFlag());
    setDialogOpen(true);
  }

  function openEditDialog(flag: FeatureFlagRecord) {
    setSelectedFlag(flag);
    setForm({
      flagCode: flag.flagCode,
      name: flag.name,
      description: flag.description ?? "",
      moduleKey: flag.moduleKey,
      enabledByDefault: flag.enabledByDefault,
      platformManagedOnly: flag.platformManagedOnly,
      notes: flag.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload: FeatureFlagPayload = {
        ...form,
        flagCode: form.flagCode?.trim() || undefined,
        description: form.description?.trim() || undefined,
        moduleKey: form.moduleKey.trim().toUpperCase(),
        notes: form.notes?.trim() || undefined,
      };
      if (selectedFlag) {
        await saasAdminApi.updateFeatureFlag(selectedFlag.id, payload);
        showSuccess("Feature flag updated successfully.");
      } else {
        await saasAdminApi.createFeatureFlag(payload);
        showSuccess("Feature flag created successfully.");
      }
      setDialogOpen(false);
      await loadFeatureFlags();
    } catch {
      showError("Feature flag changes could not be saved.");
    }
  }

  async function handleActionConfirm() {
    if (!actionFlag || !actionType) {
      return;
    }
    setActionLoading(true);
    try {
      if (actionType === "activate") {
        await saasAdminApi.activateFeatureFlag(actionFlag.id);
      } else {
        await saasAdminApi.deactivateFeatureFlag(actionFlag.id);
      }
      showSuccess(`Feature flag ${actionType}d successfully.`);
      setActionFlag(null);
      setActionType(null);
      await loadFeatureFlags();
    } catch {
      showError("Feature flag status change could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOverrideSubmit() {
    if (!selectedFlag) {
      return;
    }
    try {
      await saasAdminApi.upsertTenantFeatureOverride(selectedFlag.id, {
        tenantId: overrideTenantId,
        enabled: overrideEnabled,
        notes: overrideNotes.trim() || undefined,
      });
      showSuccess("Tenant feature override saved successfully.");
      setOverrideOpen(false);
      await loadFeatureFlags();
    } catch {
      showError("Tenant feature override could not be saved.");
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Feature Flags"
        description="Control commercial entitlements, staged rollouts, and per-tenant overrides for operational modules and portals."
      >
        <Button
          startIcon={<AddRoundedIcon />}
          variant="contained"
          onClick={openCreateDialog}
        >
          New Feature Flag
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search feature flags"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {featureFlagStatuses.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Module"
          value={moduleKey}
          onChange={(event) => setModuleKey(event.target.value)}
        >
          {moduleKeys.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All modules"}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      {loading ? <LoadingState /> : null}
      {error ? (
        <PageCard>
          <Typography color="error">{error}</Typography>
        </PageCard>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No feature flags found"
          description="Create feature flags to control entitlements, rollouts, and tenant-specific overrides."
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <PageCard sx={{ p: 0 }}>
          <Paper sx={{ overflowX: "auto", backgroundColor: "transparent" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Feature</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell>Overrides</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.flagCode}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.moduleKey}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.enabledByDefault ? "Enabled" : "Disabled"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.platformManagedOnly
                          ? "Platform-managed only"
                          : "Tenant override allowed"}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.overrideCount}</TableCell>
                    <TableCell>
                      <StatusChip value={item.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="Edit feature flag"
                        onClick={() => openEditDialog(item)}
                      >
                        <EditRoundedIcon />
                      </TableActionButton>
                      <TableActionButton
                        title="Configure tenant override"
                        onClick={() => {
                          setSelectedFlag(item);
                          setOverrideTenantId("");
                          setOverrideEnabled(item.enabledByDefault);
                          setOverrideNotes("");
                          setOverrideOpen(true);
                        }}
                      >
                        <TuneRoundedIcon />
                      </TableActionButton>
                      {item.status !== "ACTIVE" ? (
                        <TableActionButton
                          title="Activate feature flag"
                          onClick={() => {
                            setActionFlag(item);
                            setActionType("activate");
                          }}
                        >
                          <PlayCircleRoundedIcon />
                        </TableActionButton>
                      ) : (
                        <TableActionButton
                          title="Deactivate feature flag"
                          onClick={() => {
                            setActionFlag(item);
                            setActionType("deactivate");
                          }}
                        >
                          <PauseCircleRoundedIcon />
                        </TableActionButton>
                      )}
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
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={size}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
          />
        </PageCard>
      ) : null}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedFlag ? "Edit Feature Flag" : "Create Feature Flag"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Flag code"
                value={form.flagCode ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    flagCode: event.target.value,
                  }))
                }
                helperText="Optional. Leave blank to auto-generate."
              />
              <TextField
                label="Feature name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <TextField
                select
                label="Module key"
                value={form.moduleKey}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    moduleKey: event.target.value,
                  }))
                }
              >
                {moduleKeys.filter(Boolean).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.enabledByDefault}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        enabledByDefault: event.target.checked,
                      }))
                    }
                  />
                }
                label="Enabled by default"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.platformManagedOnly}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        platformManagedOnly: event.target.checked,
                      }))
                    }
                  />
                }
                label="Platform-managed only"
              />
            </Stack>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={form.notes ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedFlag ? "Save Changes" : "Create Feature Flag"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tenant Feature Override</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Override {selectedFlag?.name} for a specific tenant without
              changing the global default.
            </Typography>
            <TextField
              select
              label="Tenant"
              value={overrideTenantId}
              onChange={(event) => setOverrideTenantId(event.target.value)}
            >
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.companyName}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={overrideEnabled}
                  onChange={(event) => setOverrideEnabled(event.target.checked)}
                />
              }
              label="Enabled for this tenant"
            />
            <TextField
              label="Override notes"
              multiline
              minRows={2}
              value={overrideNotes}
              onChange={(event) => setOverrideNotes(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setOverrideOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleOverrideSubmit}>
            Save Override
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(actionFlag && actionType)}
        title="Confirm feature flag action"
        description={`Are you sure you want to ${actionType} ${actionFlag?.name ?? "this feature flag"}?`}
        confirmLabel={
          actionType === "deactivate"
            ? "Deactivate feature flag"
            : "Activate feature flag"
        }
        loading={actionLoading}
        onCancel={() => {
          setActionFlag(null);
          setActionType(null);
        }}
        onConfirm={handleActionConfirm}
      />
    </Stack>
  );
}
