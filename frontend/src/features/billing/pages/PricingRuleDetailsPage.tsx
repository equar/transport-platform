import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";
import { useToast } from "../../../shared/providers/ToastProvider";
import {
  billingApi,
  type PricingRulePayload,
  type PricingRuleRecord,
} from "../api/billingApi";
import { PricingRuleUpsertDialog } from "../components/PricingRuleUpsertDialog";

type PricingRuleAction = "activate" | "suspend" | "deactivate";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value || 0);
}

function renderValue(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function renderDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function PricingRuleDetailsPage() {
  const { pricingRuleId } = useParams();
  const resolvedPricingRuleId = Number(pricingRuleId);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [pricingRule, setPricingRule] = useState<PricingRuleRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<PricingRuleAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      const response = await billingApi.getPricingRule(resolvedPricingRuleId);
      setPricingRule(response);
    } catch {
      setError("Pricing rule details could not be loaded.");
      setPricingRule(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedPricingRuleId) {
      setError("Pricing rule was not found.");
      setLoading(false);
      return;
    }
    void loadPage();
  }, [resolvedPricingRuleId]);

  async function handleSubmit(payload: PricingRulePayload) {
    if (!pricingRule) {
      return;
    }
    setSaving(true);
    try {
      await billingApi.updatePricingRule(pricingRule.id, payload);
      showSuccess("Pricing rule updated successfully.");
      setDialogOpen(false);
      await loadPage();
    } catch {
      showError("Pricing rule changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActionConfirm() {
    if (!pricingRule || !action) {
      return;
    }
    setActionLoading(true);
    try {
      if (action === "activate") {
        await billingApi.activatePricingRule(pricingRule.id);
      } else if (action === "suspend") {
        await billingApi.suspendPricingRule(pricingRule.id);
      } else {
        await billingApi.deactivatePricingRule(pricingRule.id);
      }
      showSuccess("Pricing rule status updated successfully.");
      setAction(null);
      await loadPage();
    } catch {
      showError("The pricing rule action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !pricingRule) {
    return (
      <Alert severity="error">{error ?? "Pricing rule was not found."}</Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Billing Configuration"
        title="Pricing Rule Details"
        description="Review applicability, pricing amounts, lifecycle state, and audit metadata for this pricing rule."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/company/pricing-rules"
            color="inherit"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Back to Pricing Rules
          </Button>
          {(pricingRule.status === "DRAFT" ||
            pricingRule.status === "ACTIVE" ||
            pricingRule.status === "SUSPENDED") && (
            <Button
              variant="outlined"
              startIcon={<EditRoundedIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Edit Pricing Rule
            </Button>
          )}
          {(pricingRule.status === "DRAFT" ||
            pricingRule.status === "SUSPENDED" ||
            pricingRule.status === "INACTIVE") && (
            <Button
              variant="contained"
              startIcon={<PlayCircleRoundedIcon />}
              onClick={() => setAction("activate")}
            >
              Activate Pricing Rule
            </Button>
          )}
          {pricingRule.status === "ACTIVE" && (
            <Button
              variant="outlined"
              startIcon={<PauseCircleRoundedIcon />}
              onClick={() => setAction("suspend")}
            >
              Suspend Pricing Rule
            </Button>
          )}
          {(pricingRule.status === "ACTIVE" ||
            pricingRule.status === "SUSPENDED") && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockRoundedIcon />}
              onClick={() => setAction("deactivate")}
            >
              Deactivate Pricing Rule
            </Button>
          )}
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Pricing Rule Code"
              value={pricingRule.pricingRuleCode}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Status"
              value={pricingRule.status.replaceAll("_", " ")}
              InputProps={{
                readOnly: true,
                startAdornment: <StatusChip value={pricingRule.status} />,
              }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Name"
            value={pricingRule.name}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Description"
            value={pricingRule.description ?? "-"}
            InputProps={{ readOnly: true }}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Applicability</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Bill-to Type"
              value={renderValue(pricingRule.billToType)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Pricing Model"
              value={renderValue(pricingRule.pricingModel)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Service Type"
              value={renderValue(pricingRule.serviceType)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Rider Type"
              value={renderValue(pricingRule.riderType)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Organization Type"
              value={renderValue(pricingRule.organizationType)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Contract Type"
              value={renderValue(pricingRule.contractType)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Trip Type"
            value={renderValue(pricingRule.tripType)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Pricing and Dates</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Amount"
              value={formatCurrency(pricingRule.amount, pricingRule.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Priority Order"
              value={String(pricingRule.priorityOrder)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Currency"
              value={pricingRule.currency}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Effective Start Date"
              value={renderDate(pricingRule.effectiveStartDate)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Effective End Date"
              value={renderDate(pricingRule.effectiveEndDate)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Notes"
            value={pricingRule.notes ?? "-"}
            InputProps={{ readOnly: true }}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Audit Metadata</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Created By"
              value={pricingRule.createdBy}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Created At"
              value={formatDateTime(pricingRule.createdAt)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Updated By"
              value={pricingRule.updatedBy}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Updated At"
              value={formatDateTime(pricingRule.updatedAt)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </PageCard>

      <PricingRuleUpsertDialog
        open={dialogOpen}
        pricingRule={pricingRule}
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(action)}
        title={
          action === "activate"
            ? "Activate Pricing Rule"
            : action === "suspend"
              ? "Suspend Pricing Rule"
              : "Deactivate Pricing Rule"
        }
        description={`Apply the selected lifecycle change to ${pricingRule.name} (${pricingRule.pricingRuleCode}).`}
        confirmLabel={
          action === "activate"
            ? "Activate Pricing Rule"
            : action === "suspend"
              ? "Suspend Pricing Rule"
              : "Deactivate Pricing Rule"
        }
        loading={actionLoading}
        onCancel={() => setAction(null)}
        onConfirm={handleActionConfirm}
      />
    </Stack>
  );
}
