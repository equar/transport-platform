import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
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
  type SubscriptionPlanRecord,
  type TenantSubscriptionPayload,
  type TenantSubscriptionRecord,
} from "../api/saasAdminApi";

const subscriptionStatuses = [
  "",
  "ACTIVE",
  "TRIAL",
  "SUSPENDED",
  "CANCELLED",
  "EXPIRED",
];
const planTiers = ["", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"];
const trialOptions = ["", "true", "false"];

function createEmptySubscription(): TenantSubscriptionPayload {
  return {
    tenantId: "",
    subscriptionPlanId: 0,
    effectiveStartDate: new Date().toISOString().slice(0, 10),
    effectiveEndDate: "",
    renewalDate: "",
    isTrial: false,
    trialEndDate: "",
    notes: "",
    status: "ACTIVE",
  };
}

export function TenantSubscriptionManagementPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<TenantSubscriptionRecord[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [trial, setTrial] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<TenantSubscriptionRecord | null>(null);
  const [form, setForm] = useState<TenantSubscriptionPayload>(
    createEmptySubscription(),
  );
  const [actionSubscription, setActionSubscription] =
    useState<TenantSubscriptionRecord | null>(null);
  const [actionType, setActionType] = useState<
    "activate" | "suspend" | "cancel" | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadReferenceData() {
    try {
      const [tenantResponse, planResponse] = await Promise.all([
        tenantsApi.search({ keyword: "", status: "", page: 0, size: 200 }),
        saasAdminApi.searchSubscriptionPlans({
          keyword: "",
          status: "",
          tier: "",
          page: 0,
          size: 200,
        }),
      ]);
      setTenants(tenantResponse.items);
      setPlans(planResponse.items);
    } catch {
      setTenants([]);
      setPlans([]);
    }
  }

  async function loadSubscriptions() {
    setLoading(true);
    setError(null);
    try {
      const response = await saasAdminApi.searchTenantSubscriptions({
        keyword,
        status,
        planTier,
        trial,
        page,
        size,
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Tenant subscriptions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReferenceData();
  }, []);

  useEffect(() => {
    void loadSubscriptions();
  }, [keyword, status, planTier, trial, page, size]);

  function openCreateDialog() {
    setSelectedSubscription(null);
    setForm(createEmptySubscription());
    setDialogOpen(true);
  }

  function openEditDialog(subscription: TenantSubscriptionRecord) {
    setSelectedSubscription(subscription);
    setForm({
      tenantId: subscription.tenantId,
      subscriptionPlanId: subscription.subscriptionPlanId,
      effectiveStartDate: subscription.effectiveStartDate,
      effectiveEndDate: subscription.effectiveEndDate ?? "",
      renewalDate: subscription.renewalDate ?? "",
      isTrial: subscription.trial,
      trialEndDate: subscription.trialEndDate ?? "",
      notes: subscription.notes ?? "",
      status: subscription.status,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload: TenantSubscriptionPayload = {
        ...form,
        effectiveEndDate: form.effectiveEndDate || undefined,
        renewalDate: form.renewalDate || undefined,
        trialEndDate: form.trialEndDate || undefined,
        notes: form.notes?.trim() || undefined,
      };
      if (selectedSubscription) {
        await saasAdminApi.updateTenantSubscription(
          selectedSubscription.id,
          payload,
        );
        showSuccess("Tenant subscription updated successfully.");
      } else {
        await saasAdminApi.createTenantSubscription(payload);
        showSuccess("Tenant subscription created successfully.");
      }
      setDialogOpen(false);
      await loadSubscriptions();
    } catch {
      showError("Tenant subscription changes could not be saved.");
    }
  }

  async function handleActionConfirm() {
    if (!actionSubscription || !actionType) {
      return;
    }
    setActionLoading(true);
    try {
      if (actionType === "activate") {
        await saasAdminApi.activateTenantSubscription(actionSubscription.id);
      } else if (actionType === "suspend") {
        await saasAdminApi.suspendTenantSubscription(actionSubscription.id);
      } else {
        await saasAdminApi.cancelTenantSubscription(actionSubscription.id);
      }
      showSuccess(`Tenant subscription ${actionType}d successfully.`);
      setActionSubscription(null);
      setActionType(null);
      await loadSubscriptions();
    } catch {
      showError("Tenant subscription status change could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Tenant Subscriptions"
        description="Assign commercial plans to tenants, manage trials, and control lifecycle transitions without breaking tenant isolation."
      >
        <Button
          startIcon={<AddRoundedIcon />}
          variant="contained"
          onClick={openCreateDialog}
        >
          Assign Subscription
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search subscriptions"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {subscriptionStatuses.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Plan tier"
          value={planTier}
          onChange={(event) => setPlanTier(event.target.value)}
        >
          {planTiers.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All tiers"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Trial"
          value={trial}
          onChange={(event) => setTrial(event.target.value)}
        >
          {trialOptions.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option === ""
                ? "All"
                : option === "true"
                  ? "Trial only"
                  : "Non-trial"}
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
          title="No tenant subscriptions found"
          description="Assign plans to tenants to enable SaaS packaging, trials, and future billing controls."
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <PageCard sx={{ p: 0 }}>
          <Paper sx={{ overflowX: "auto", backgroundColor: "transparent" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Lifecycle</TableCell>
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
                          {item.tenantName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.tenantCode}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.planName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.planCode} • {item.planTier}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip value={item.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Start {item.effectiveStartDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.trial
                          ? `Trial ends ${item.trialEndDate ?? "TBD"}`
                          : `Renewal ${item.renewalDate ?? "Not set"}`}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="Edit subscription"
                        onClick={() => openEditDialog(item)}
                      >
                        <EditRoundedIcon />
                      </TableActionButton>
                      {item.status !== "ACTIVE" && item.status !== "TRIAL" ? (
                        <TableActionButton
                          title="Activate subscription"
                          onClick={() => {
                            setActionSubscription(item);
                            setActionType("activate");
                          }}
                        >
                          <PlayCircleRoundedIcon />
                        </TableActionButton>
                      ) : (
                        <TableActionButton
                          title="Suspend subscription"
                          onClick={() => {
                            setActionSubscription(item);
                            setActionType("suspend");
                          }}
                        >
                          <PauseCircleRoundedIcon />
                        </TableActionButton>
                      )}
                      {item.status !== "CANCELLED" ? (
                        <TableActionButton
                          title="Cancel subscription"
                          onClick={() => {
                            setActionSubscription(item);
                            setActionType("cancel");
                          }}
                        >
                          <CancelRoundedIcon />
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
          {selectedSubscription
            ? "Edit Tenant Subscription"
            : "Assign Tenant Subscription"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label="Tenant"
                value={form.tenantId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tenantId: event.target.value,
                  }))
                }
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.companyName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Subscription plan"
                value={form.subscriptionPlanId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subscriptionPlanId: Number(event.target.value),
                  }))
                }
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.tier})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target
                      .value as TenantSubscriptionPayload["status"],
                  }))
                }
              >
                {subscriptionStatuses.filter(Boolean).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                type="date"
                label="Effective start"
                InputLabelProps={{ shrink: true }}
                value={form.effectiveStartDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    effectiveStartDate: event.target.value,
                  }))
                }
              />
              <TextField
                type="date"
                label="Effective end"
                InputLabelProps={{ shrink: true }}
                value={form.effectiveEndDate ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    effectiveEndDate: event.target.value,
                  }))
                }
              />
              <TextField
                type="date"
                label="Renewal date"
                InputLabelProps={{ shrink: true }}
                value={form.renewalDate ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    renewalDate: event.target.value,
                  }))
                }
              />
              <TextField
                type="date"
                label="Trial end"
                InputLabelProps={{ shrink: true }}
                value={form.trialEndDate ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    trialEndDate: event.target.value,
                  }))
                }
              />
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isTrial}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isTrial: event.target.checked,
                      status: event.target.checked
                        ? "TRIAL"
                        : current.status === "TRIAL"
                          ? "ACTIVE"
                          : current.status,
                    }))
                  }
                />
              }
              label="Trial subscription"
            />
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
            {selectedSubscription ? "Save Changes" : "Assign Subscription"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(actionSubscription && actionType)}
        title="Confirm subscription action"
        description={`Are you sure you want to ${actionType} ${actionSubscription?.tenantName ?? "this subscription"}?`}
        confirmLabel={
          actionType === "cancel"
            ? "Cancel subscription"
            : actionType === "suspend"
              ? "Suspend subscription"
              : "Activate subscription"
        }
        loading={actionLoading}
        onCancel={() => {
          setActionSubscription(null);
          setActionType(null);
        }}
        onConfirm={handleActionConfirm}
      />
    </Stack>
  );
}
