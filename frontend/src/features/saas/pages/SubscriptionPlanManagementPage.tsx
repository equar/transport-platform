import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import {
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
import {
  saasAdminApi,
  type SubscriptionPlanPayload,
  type SubscriptionPlanRecord,
} from "../api/saasAdminApi";

const planStatuses = ["", "DRAFT", "ACTIVE", "INACTIVE", "RETIRED"];
const planTiers = ["", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"];

function createEmptyPlan(): SubscriptionPlanPayload {
  return {
    planCode: "",
    name: "",
    description: "",
    tier: "STARTER",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "USD",
    maxUsers: 0,
    maxDrivers: 0,
    maxVehicles: 0,
    maxRiders: 0,
    maxOrganizations: 0,
    includedFeatureCodes: [],
    notes: "",
  };
}

export function SubscriptionPlanManagementPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<SubscriptionPlanRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [tier, setTier] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlanRecord | null>(null);
  const [form, setForm] = useState<SubscriptionPlanPayload>(createEmptyPlan());
  const [featureCodesText, setFeatureCodesText] = useState("");
  const [actionPlan, setActionPlan] = useState<SubscriptionPlanRecord | null>(
    null,
  );
  const [actionType, setActionType] = useState<
    "activate" | "deactivate" | "retire" | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadPlans() {
    setLoading(true);
    setError(null);
    try {
      const response = await saasAdminApi.searchSubscriptionPlans({
        keyword,
        status,
        tier,
        page,
        size,
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Subscription plans could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, [keyword, status, tier, page, size]);

  function openCreateDialog() {
    setSelectedPlan(null);
    setForm(createEmptyPlan());
    setFeatureCodesText("");
    setDialogOpen(true);
  }

  function openEditDialog(plan: SubscriptionPlanRecord) {
    setSelectedPlan(plan);
    setForm({
      planCode: plan.planCode,
      name: plan.name,
      description: plan.description ?? "",
      tier: plan.tier,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      currency: plan.currency,
      maxUsers: plan.maxUsers,
      maxDrivers: plan.maxDrivers,
      maxVehicles: plan.maxVehicles,
      maxRiders: plan.maxRiders,
      maxOrganizations: plan.maxOrganizations,
      includedFeatureCodes: plan.includedFeatureCodes,
      notes: plan.notes ?? "",
    });
    setFeatureCodesText(plan.includedFeatureCodes.join(", "));
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload: SubscriptionPlanPayload = {
        ...form,
        planCode: form.planCode?.trim() || undefined,
        description: form.description?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        currency: form.currency.trim().toUpperCase(),
        includedFeatureCodes: featureCodesText
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean),
      };

      if (selectedPlan) {
        await saasAdminApi.updateSubscriptionPlan(selectedPlan.id, payload);
        showSuccess("Subscription plan updated successfully.");
      } else {
        await saasAdminApi.createSubscriptionPlan(payload);
        showSuccess("Subscription plan created successfully.");
      }
      setDialogOpen(false);
      await loadPlans();
    } catch {
      showError("Subscription plan changes could not be saved.");
    }
  }

  async function handleActionConfirm() {
    if (!actionPlan || !actionType) {
      return;
    }
    setActionLoading(true);
    try {
      if (actionType === "activate") {
        await saasAdminApi.activateSubscriptionPlan(actionPlan.id);
      } else if (actionType === "deactivate") {
        await saasAdminApi.deactivateSubscriptionPlan(actionPlan.id);
      } else {
        await saasAdminApi.retireSubscriptionPlan(actionPlan.id);
      }
      showSuccess(`Subscription plan ${actionType}d successfully.`);
      setActionPlan(null);
      setActionType(null);
      await loadPlans();
    } catch {
      showError("Subscription plan status change could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Subscription Plans"
        description="Commercial packaging for tenant entitlements, usage limits, and future billing readiness."
      >
        <Button
          startIcon={<AddRoundedIcon />}
          variant="contained"
          onClick={openCreateDialog}
        >
          New Plan
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search plans"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {planStatuses.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Tier"
          value={tier}
          onChange={(event) => setTier(event.target.value)}
        >
          {planTiers.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All tiers"}
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
          title="No subscription plans found"
          description="Create your first plan to define SaaS packaging and tenant entitlements."
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <PageCard sx={{ p: 0 }}>
          <Paper sx={{ overflowX: "auto", backgroundColor: "transparent" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Pricing</TableCell>
                  <TableCell>Limits</TableCell>
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
                          {item.planCode}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.tier}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.currency} {item.monthlyPrice.toFixed(2)}/mo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.currency} {item.annualPrice.toFixed(2)}/yr
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Users {item.maxUsers} | Drivers {item.maxDrivers}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vehicles {item.maxVehicles} | Riders {item.maxRiders}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip value={item.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="Edit plan"
                        onClick={() => openEditDialog(item)}
                      >
                        <EditRoundedIcon />
                      </TableActionButton>
                      {item.status !== "ACTIVE" ? (
                        <TableActionButton
                          title="Activate plan"
                          onClick={() => {
                            setActionPlan(item);
                            setActionType("activate");
                          }}
                        >
                          <PlayCircleRoundedIcon />
                        </TableActionButton>
                      ) : (
                        <TableActionButton
                          title="Deactivate plan"
                          onClick={() => {
                            setActionPlan(item);
                            setActionType("deactivate");
                          }}
                        >
                          <PauseCircleRoundedIcon />
                        </TableActionButton>
                      )}
                      {item.status !== "RETIRED" ? (
                        <TableActionButton
                          title="Retire plan"
                          onClick={() => {
                            setActionPlan(item);
                            setActionType("retire");
                          }}
                        >
                          <ArchiveRoundedIcon />
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
          {selectedPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Plan code"
                value={form.planCode ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    planCode: event.target.value,
                  }))
                }
                helperText="Optional. Leave blank to auto-generate."
              />
              <TextField
                label="Plan name"
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
                label="Tier"
                value={form.tier}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tier: event.target.value as SubscriptionPlanPayload["tier"],
                  }))
                }
              >
                {planTiers.filter(Boolean).map((option) => (
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
              <TextField
                type="number"
                label="Monthly price"
                value={form.monthlyPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlyPrice: Number(event.target.value),
                  }))
                }
              />
              <TextField
                type="number"
                label="Annual price"
                value={form.annualPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    annualPrice: Number(event.target.value),
                  }))
                }
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency: event.target.value,
                  }))
                }
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                type="number"
                label="Max users"
                value={form.maxUsers}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxUsers: Number(event.target.value),
                  }))
                }
              />
              <TextField
                type="number"
                label="Max drivers"
                value={form.maxDrivers}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxDrivers: Number(event.target.value),
                  }))
                }
              />
              <TextField
                type="number"
                label="Max vehicles"
                value={form.maxVehicles}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxVehicles: Number(event.target.value),
                  }))
                }
              />
              <TextField
                type="number"
                label="Max riders"
                value={form.maxRiders}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxRiders: Number(event.target.value),
                  }))
                }
              />
              <TextField
                type="number"
                label="Max organizations"
                value={form.maxOrganizations}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxOrganizations: Number(event.target.value),
                  }))
                }
              />
            </Stack>
            <TextField
              label="Included feature codes"
              value={featureCodesText}
              onChange={(event) => setFeatureCodesText(event.target.value)}
              helperText="Comma-separated feature flag codes."
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
            {selectedPlan ? "Save Changes" : "Create Plan"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(actionPlan && actionType)}
        title="Confirm plan action"
        description={`Are you sure you want to ${actionType} ${actionPlan?.name ?? "this plan"}?`}
        confirmLabel={
          actionType === "retire"
            ? "Retire plan"
            : actionType === "deactivate"
              ? "Deactivate plan"
              : "Activate plan"
        }
        loading={actionLoading}
        onCancel={() => {
          setActionPlan(null);
          setActionType(null);
        }}
        onConfirm={handleActionConfirm}
      />
    </Stack>
  );
}
