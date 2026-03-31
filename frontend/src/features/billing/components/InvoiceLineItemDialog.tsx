import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  chargeSourceTypeOptions,
  type InvoiceLineItemPayload,
  type InvoiceLineItemRecord,
} from "../api/billingApi";

interface InvoiceLineItemDialogProps {
  open: boolean;
  lineItem: InvoiceLineItemRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: InvoiceLineItemPayload) => Promise<void>;
}

function defaultForm(): InvoiceLineItemPayload {
  return {
    description: "",
    chargeSourceType: "MANUAL",
    sourceReferenceId: null,
    pricingRuleId: null,
    quantity: 1,
    unitPrice: 0,
    serviceDate: "",
    servicePeriodLabel: "",
    notes: "",
  };
}

export function InvoiceLineItemDialog({
  open,
  lineItem,
  loading,
  onClose,
  onSubmit,
}: InvoiceLineItemDialogProps) {
  const [form, setForm] = useState<InvoiceLineItemPayload>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    if (!lineItem) {
      setForm(defaultForm());
      return;
    }

    setForm({
      description: lineItem.description,
      chargeSourceType: lineItem.chargeSourceType,
      sourceReferenceId: lineItem.sourceReferenceId,
      pricingRuleId: lineItem.pricingRuleId,
      quantity: lineItem.quantity,
      unitPrice: lineItem.unitPrice,
      serviceDate: lineItem.serviceDate ?? "",
      servicePeriodLabel: lineItem.servicePeriodLabel ?? "",
      notes: lineItem.notes ?? "",
    });
  }, [lineItem, open]);

  function updateField<Key extends keyof InvoiceLineItemPayload>(
    field: Key,
    value: InvoiceLineItemPayload[Key],
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

    if (!form.description.trim()) {
      nextErrors.description = "Description is required.";
    }
    if (form.quantity <= 0) {
      nextErrors.quantity = "Quantity must be greater than zero.";
    }
    if (form.unitPrice < 0) {
      nextErrors.unitPrice = "Unit price cannot be negative.";
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
      description: form.description.trim(),
      sourceReferenceId: form.sourceReferenceId || null,
      pricingRuleId: form.pricingRuleId || null,
      serviceDate: form.serviceDate || null,
      servicePeriodLabel: form.servicePeriodLabel?.trim() || null,
      notes: form.notes?.trim() || null,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {lineItem ? "Update Line Item" : "Add Line Item"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            error={Boolean(errors.description)}
            helperText={errors.description}
            fullWidth
          />
          <TextField
            select
            label="Charge Source Type"
            value={form.chargeSourceType}
            onChange={(event) =>
              updateField(
                "chargeSourceType",
                event.target
                  .value as InvoiceLineItemPayload["chargeSourceType"],
              )
            }
            fullWidth
          >
            {chargeSourceTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option.replaceAll("_", " ")}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(event) =>
                updateField("quantity", Number(event.target.value) || 0)
              }
              error={Boolean(errors.quantity)}
              helperText={errors.quantity}
              fullWidth
            />
            <TextField
              label="Unit Price"
              type="number"
              value={form.unitPrice}
              onChange={(event) =>
                updateField("unitPrice", Number(event.target.value) || 0)
              }
              error={Boolean(errors.unitPrice)}
              helperText={errors.unitPrice}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Service Date"
              type="date"
              value={form.serviceDate ?? ""}
              onChange={(event) =>
                updateField("serviceDate", event.target.value)
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Service Period Label"
              value={form.servicePeriodLabel ?? ""}
              onChange={(event) =>
                updateField("servicePeriodLabel", event.target.value)
              }
              fullWidth
            />
          </Stack>
          <TextField
            label="Notes"
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading
            ? "Saving..."
            : lineItem
              ? "Save Line Item"
              : "Add Line Item"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
