import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
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
import { formatDateTime } from "../../../shared/utils/format";
import { useToast } from "../../../shared/providers/ToastProvider";
import {
  billingApi,
  billToTypeOptions,
  pricingModelOptions,
  pricingRuleStatusOptions,
  type BillToType,
  type PricingModel,
  type PricingRulePayload,
  type PricingRuleRecord,
  type PricingRuleStatus,
} from "../api/billingApi";
import { serviceTypeOptions, type ServiceType } from "../../rides/api/ridesApi";
import { PricingRuleUpsertDialog } from "../components/PricingRuleUpsertDialog";

type PricingRuleAction = "activate" | "suspend" | "deactivate";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value || 0);
}

export function PricingRuleManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<PricingRuleRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<PricingRuleStatus | "">("");
  const [pricingModel, setPricingModel] = useState<PricingModel | "">("");
  const [billToType, setBillToType] = useState<BillToType | "">("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPricingRule, setSelectedPricingRule] =
    useState<PricingRuleRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: PricingRuleAction;
    pricingRule: PricingRuleRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadPricingRules() {
    setLoading(true);
    setError(null);
    try {
      const response = await billingApi.searchPricingRules({
        keyword,
        status,
        pricingModel,
        billToType,
        serviceType,
        effectiveFrom: "",
        effectiveTo: "",
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items as PricingRuleRecord[]);
      setTotal(response.totalElements);
    } catch {
      setError("Pricing rules could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPricingRules();
  }, [billToType, keyword, page, pricingModel, serviceType, size, status]);

  async function handleSubmit(payload: PricingRulePayload) {
    setSaving(true);
    try {
      if (selectedPricingRule) {
        await billingApi.updatePricingRule(selectedPricingRule.id, payload);
        showSuccess("Pricing rule updated successfully.");
      } else {
        await billingApi.createPricingRule(payload);
        showSuccess("Pricing rule created successfully.");
      }
      setDialogOpen(false);
      setSelectedPricingRule(null);
      await loadPricingRules();
    } catch {
      showError("Pricing rule changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActionConfirm() {
    if (!actionState) {
      return;
    }

    setActionLoading(true);
    try {
      if (actionState.type === "activate") {
        await billingApi.activatePricingRule(actionState.pricingRule.id);
      } else if (actionState.type === "suspend") {
        await billingApi.suspendPricingRule(actionState.pricingRule.id);
      } else {
        await billingApi.deactivatePricingRule(actionState.pricingRule.id);
      }
      showSuccess("Pricing rule status updated successfully.");
      setActionState(null);
      await loadPricingRules();
    } catch {
      showError("The pricing rule action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  function renderActions(pricingRule: PricingRuleRecord) {
    return (
      <>
        <TableActionButton
          title="View Details"
          onClick={() => navigate(`/company/pricing-rules/${pricingRule.id}`)}
        >
          <VisibilityRoundedIcon />
        </TableActionButton>
        {(pricingRule.status === "DRAFT" ||
          pricingRule.status === "ACTIVE" ||
          pricingRule.status === "SUSPENDED") && (
          <TableActionButton
            title="Edit Pricing Rule"
            onClick={() => {
              setSelectedPricingRule(pricingRule);
              setDialogOpen(true);
            }}
          >
            <EditRoundedIcon />
          </TableActionButton>
        )}
        {(pricingRule.status === "DRAFT" ||
          pricingRule.status === "SUSPENDED" ||
          pricingRule.status === "INACTIVE") && (
          <TableActionButton
            title="Activate Pricing Rule"
            onClick={() => setActionState({ type: "activate", pricingRule })}
          >
            <PlayCircleRoundedIcon />
          </TableActionButton>
        )}
        {pricingRule.status === "ACTIVE" && (
          <TableActionButton
            title="Suspend Pricing Rule"
            onClick={() => setActionState({ type: "suspend", pricingRule })}
          >
            <PauseCircleRoundedIcon />
          </TableActionButton>
        )}
        {(pricingRule.status === "ACTIVE" ||
          pricingRule.status === "SUSPENDED") && (
          <TableActionButton
            title="Deactivate Pricing Rule"
            onClick={() => setActionState({ type: "deactivate", pricingRule })}
          >
            <BlockRoundedIcon />
          </TableActionButton>
        )}
      </>
    );
  }

  function actionTitle(type: PricingRuleAction) {
    if (type === "activate") {
      return "Activate Pricing Rule";
    }
    if (type === "suspend") {
      return "Suspend Pricing Rule";
    }
    return "Deactivate Pricing Rule";
  }

  function actionDescription(action: {
    type: PricingRuleAction;
    pricingRule: PricingRuleRecord;
  }) {
    const name = `${action.pricingRule.name} (${action.pricingRule.pricingRuleCode})`;
    if (action.type === "activate") {
      return `Activate ${name} so it becomes available for billing previews and invoice generation.`;
    }
    if (action.type === "suspend") {
      return `Suspend ${name} to pause new billing usage without deleting its configuration.`;
    }
    return `Deactivate ${name} to retire it from active billing workflows.`;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Billing"
        title="Pricing Rules"
        description="Manage pricing rules for rider, guardian, organization, and contract billing scenarios with clear service applicability and lifecycle controls."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedPricingRule(null);
            setDialogOpen(true);
          }}
        >
          Create Pricing Rule
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by code, name, or description"
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
            setStatus(event.target.value as PricingRuleStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {pricingRuleStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Pricing Model"
          value={pricingModel}
          onChange={(event) => {
            setPage(0);
            setPricingModel(event.target.value as PricingModel | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Models</MenuItem>
          {pricingModelOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Bill-to Type"
          value={billToType}
          onChange={(event) => {
            setPage(0);
            setBillToType(event.target.value as BillToType | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Bill-to Types</MenuItem>
          {billToTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Service Type"
          value={serviceType}
          onChange={(event) => {
            setPage(0);
            setServiceType(event.target.value as ServiceType | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Service Types</MenuItem>
          {serviceTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Pricing rules will appear here once you create or activate them."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Pricing Model</TableCell>
                  <TableCell>Bill-to Type</TableCell>
                  <TableCell>Service Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Effective Start</TableCell>
                  <TableCell>Effective End</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((pricingRule) => (
                  <TableRow key={pricingRule.id} hover>
                    <TableCell>{pricingRule.pricingRuleCode}</TableCell>
                    <TableCell>{pricingRule.name}</TableCell>
                    <TableCell>
                      <StatusChip value={pricingRule.pricingModel} />
                    </TableCell>
                    <TableCell>
                      <StatusChip value={pricingRule.billToType} />
                    </TableCell>
                    <TableCell>
                      {pricingRule.serviceType
                        ? pricingRule.serviceType.replaceAll("_", " ")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(pricingRule.amount, pricingRule.currency)}
                    </TableCell>
                    <TableCell>
                      {formatDate(pricingRule.effectiveStartDate)}
                    </TableCell>
                    <TableCell>
                      {formatDate(pricingRule.effectiveEndDate)}
                    </TableCell>
                    <TableCell>{pricingRule.priorityOrder}</TableCell>
                    <TableCell>
                      <StatusChip value={pricingRule.status} />
                    </TableCell>
                    <TableCell>
                      {formatDateTime(pricingRule.updatedAt)}
                    </TableCell>
                    <TableCell align="right">
                      {renderActions(pricingRule)}
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
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </PageCard>

      <PricingRuleUpsertDialog
        open={dialogOpen}
        pricingRule={selectedPricingRule}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedPricingRule(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={
          actionState ? actionTitle(actionState.type) : "Pricing Rule Action"
        }
        description={actionState ? actionDescription(actionState) : ""}
        confirmLabel={actionState ? actionTitle(actionState.type) : "Confirm"}
        loading={actionLoading}
        onCancel={() => setActionState(null)}
        onConfirm={handleActionConfirm}
      />
    </Stack>
  );
}
