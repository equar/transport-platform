import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  billToTypeOptions,
  contractTypeOptions,
  organizationTypeOptions,
  pricingModelOptions,
  riderTypeOptions,
  type PricingRulePayload,
  type PricingRuleRecord,
} from "../api/billingApi";
import {
  rideTripTypeOptions,
  serviceTypeOptions,
} from "../../rides/api/ridesApi";

interface PricingRuleUpsertDialogProps {
  open: boolean;
  pricingRule: PricingRuleRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: PricingRulePayload) => Promise<void>;
}

function defaultForm(): PricingRulePayload {
  return {
    name: "",
    description: "",
    pricingModel: "FLAT_RATE",
    billToType: "RIDER",
    serviceType: null,
    riderType: null,
    organizationType: null,
    contractType: null,
    tripType: null,
    amount: 0,
    currency: "USD",
    effectiveStartDate: new Date().toISOString().slice(0, 10),
    effectiveEndDate: "",
    priorityOrder: 1,
    notes: "",
  };
}

export function PricingRuleUpsertDialog({
  open,
  pricingRule,
  loading,
  onClose,
  onSubmit,
}: PricingRuleUpsertDialogProps) {
  const [form, setForm] = useState<PricingRulePayload>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    if (!pricingRule) {
      setForm(defaultForm());
      return;
    }

    setForm({
      name: pricingRule.name,
      description: pricingRule.description ?? "",
      pricingModel: pricingRule.pricingModel,
      billToType: pricingRule.billToType,
      serviceType: pricingRule.serviceType,
      riderType: pricingRule.riderType,
      organizationType: pricingRule.organizationType,
      contractType: pricingRule.contractType,
      tripType: pricingRule.tripType,
      amount: pricingRule.amount,
      currency: pricingRule.currency,
      effectiveStartDate: pricingRule.effectiveStartDate,
      effectiveEndDate: pricingRule.effectiveEndDate ?? "",
      priorityOrder: pricingRule.priorityOrder,
      notes: pricingRule.notes ?? "",
    });
  }, [open, pricingRule]);

  function updateField<Key extends keyof PricingRulePayload>(
    field: Key,
    value: PricingRulePayload[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Pricing rule name is required.";
    }
    if (form.amount <= 0) {
      nextErrors.amount = "Amount must be greater than zero.";
    }
    if (!form.currency.trim() || form.currency.trim().length !== 3) {
      nextErrors.currency = "Currency must be a 3-letter ISO code.";
    }
    if (!form.effectiveStartDate) {
      nextErrors.effectiveStartDate = "Effective start date is required.";
    }
    if (
      form.effectiveStartDate &&
      form.effectiveEndDate &&
      form.effectiveEndDate < form.effectiveStartDate
    ) {
      nextErrors.effectiveEndDate =
        "Effective end date cannot be earlier than the start date.";
    }
    if (form.priorityOrder < 1) {
      nextErrors.priorityOrder = "Priority order must be at least 1.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }

    await onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      currency: form.currency.trim().toUpperCase(),
      effectiveEndDate: form.effectiveEndDate || null,
      notes: form.notes?.trim() || null,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {pricingRule ? "Update Pricing Rule" : "Create Pricing Rule"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Basic Information
            </Typography>
            <TextField
              label="Pricing Rule Name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description ?? ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Applicability
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Pricing Model"
                value={form.pricingModel}
                onChange={(event) =>
                  updateField(
                    "pricingModel",
                    event.target.value as PricingRulePayload["pricingModel"],
                  )
                }
                fullWidth
              >
                {pricingModelOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Bill-to Type"
                value={form.billToType}
                onChange={(event) =>
                  updateField(
                    "billToType",
                    event.target.value as PricingRulePayload["billToType"],
                  )
                }
                fullWidth
              >
                {billToTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Service Type"
                value={form.serviceType ?? ""}
                onChange={(event) =>
                  updateField(
                    "serviceType",
                    (event.target.value ||
                      null) as PricingRulePayload["serviceType"],
                  )
                }
                fullWidth
              >
                <MenuItem value="">All Service Types</MenuItem>
                {serviceTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Trip Type"
                value={form.tripType ?? ""}
                onChange={(event) =>
                  updateField(
                    "tripType",
                    (event.target.value ||
                      null) as PricingRulePayload["tripType"],
                  )
                }
                fullWidth
              >
                <MenuItem value="">All Trip Types</MenuItem>
                {rideTripTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Rider Type"
                value={form.riderType ?? ""}
                onChange={(event) =>
                  updateField(
                    "riderType",
                    (event.target.value ||
                      null) as PricingRulePayload["riderType"],
                  )
                }
                fullWidth
              >
                <MenuItem value="">All Rider Types</MenuItem>
                {riderTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Organization Type"
                value={form.organizationType ?? ""}
                onChange={(event) =>
                  updateField(
                    "organizationType",
                    (event.target.value ||
                      null) as PricingRulePayload["organizationType"],
                  )
                }
                fullWidth
              >
                <MenuItem value="">All Organization Types</MenuItem>
                {organizationTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              select
              label="Contract Type"
              value={form.contractType ?? ""}
              onChange={(event) =>
                updateField(
                  "contractType",
                  (event.target.value ||
                    null) as PricingRulePayload["contractType"],
                )
              }
              fullWidth
            >
              <MenuItem value="">All Contract Types</MenuItem>
              {contractTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Pricing Details
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(event) =>
                  updateField("amount", Number(event.target.value) || 0)
                }
                error={Boolean(errors.amount)}
                helperText={errors.amount}
                fullWidth
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(event) =>
                  updateField("currency", event.target.value)
                }
                error={Boolean(errors.currency)}
                helperText={errors.currency}
                fullWidth
              />
              <TextField
                label="Priority Order"
                type="number"
                value={form.priorityOrder}
                onChange={(event) =>
                  updateField("priorityOrder", Number(event.target.value) || 0)
                }
                error={Boolean(errors.priorityOrder)}
                helperText={errors.priorityOrder}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Effective Dates
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Effective Start Date"
                type="date"
                value={form.effectiveStartDate}
                onChange={(event) =>
                  updateField("effectiveStartDate", event.target.value)
                }
                error={Boolean(errors.effectiveStartDate)}
                helperText={errors.effectiveStartDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Effective End Date"
                type="date"
                value={form.effectiveEndDate ?? ""}
                onChange={(event) =>
                  updateField("effectiveEndDate", event.target.value)
                }
                error={Boolean(errors.effectiveEndDate)}
                helperText={errors.effectiveEndDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Notes
            </Typography>
            <TextField
              label="Notes"
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading
            ? "Saving..."
            : pricingRule
              ? "Save Pricing Rule"
              : "Create Pricing Rule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
