import {
  Autocomplete,
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
  billingApi,
  type InvoicePayload,
  type InvoiceRecord,
  type LookupOption,
} from "../api/billingApi";

interface InvoiceUpsertDialogProps {
  open: boolean;
  invoice: InvoiceRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: InvoicePayload) => Promise<void>;
}

function defaultForm(): InvoicePayload {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    billToType: "RIDER",
    billToId: null,
    billingPeriodStart: "",
    billingPeriodEnd: "",
    invoiceDate: today.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    taxAmount: 0,
    discountAmount: 0,
    currency: "USD",
    notes: "",
  };
}

export function InvoiceUpsertDialog({
  open,
  invoice,
  loading,
  onClose,
  onSubmit,
}: InvoiceUpsertDialogProps) {
  const [form, setForm] = useState<InvoicePayload>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<LookupOption | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    if (!invoice) {
      setForm(defaultForm());
      setSelectedOption(null);
      setSearchText("");
      return;
    }

    setForm({
      billToType: invoice.billToType,
      billToId: invoice.billToId,
      billingPeriodStart: invoice.billingPeriodStart ?? "",
      billingPeriodEnd: invoice.billingPeriodEnd ?? "",
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      currency: invoice.currency,
      notes: invoice.notes ?? "",
    });
    const option = {
      id: invoice.billToId,
      label: invoice.billToNameSnapshot,
      secondaryLabel: invoice.billToType.replaceAll("_", " "),
    };
    setSelectedOption(option);
    setOptions([option]);
    setSearchText(invoice.billToNameSnapshot);
  }, [open, invoice]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setOptionsLoading(true);
    billingApi
      .searchBillToOptions(form.billToType, searchText)
      .then((response) => {
        if (active) {
          setOptions((current) => {
            if (!selectedOption) {
              return response;
            }
            const exists = response.some(
              (item) => item.id === selectedOption.id,
            );
            return exists ? response : [selectedOption, ...response];
          });
        }
      })
      .finally(() => {
        if (active) {
          setOptionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [form.billToType, open, searchText, selectedOption]);

  function updateField<Key extends keyof InvoicePayload>(
    field: Key,
    value: InvoicePayload[Key],
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

    if (!selectedOption) {
      nextErrors.billToId = "Bill-to target is required.";
    }
    if (!form.invoiceDate) {
      nextErrors.invoiceDate = "Invoice date is required.";
    }
    if (!form.dueDate) {
      nextErrors.dueDate = "Due date is required.";
    }
    if (form.invoiceDate && form.dueDate && form.dueDate < form.invoiceDate) {
      nextErrors.dueDate = "Due date cannot be earlier than the invoice date.";
    }
    if (
      form.billingPeriodStart &&
      form.billingPeriodEnd &&
      form.billingPeriodEnd < form.billingPeriodStart
    ) {
      nextErrors.billingPeriodEnd =
        "Billing period end date cannot be earlier than the start date.";
    }
    if (!form.currency.trim() || form.currency.trim().length !== 3) {
      nextErrors.currency = "Currency must be a 3-letter ISO code.";
    }
    if (form.taxAmount < 0) {
      nextErrors.taxAmount = "Tax amount cannot be negative.";
    }
    if (form.discountAmount < 0) {
      nextErrors.discountAmount = "Discount amount cannot be negative.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !selectedOption) {
      return;
    }

    await onSubmit({
      ...form,
      billToId: selectedOption.id,
      billingPeriodStart: form.billingPeriodStart || null,
      billingPeriodEnd: form.billingPeriodEnd || null,
      currency: form.currency.trim().toUpperCase(),
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
      <DialogTitle>{invoice ? "Update Invoice" : "Create Invoice"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Bill-to Details
            </Typography>
            <TextField
              select
              label="Bill-to Type"
              value={form.billToType}
              onChange={(event) => {
                updateField(
                  "billToType",
                  event.target.value as InvoicePayload["billToType"],
                );
                setSelectedOption(null);
                setSearchText("");
                setOptions([]);
              }}
              fullWidth
            >
              {billToTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              options={options}
              loading={optionsLoading}
              value={selectedOption}
              onChange={(_, value) => {
                setSelectedOption(value);
                updateField("billToId", value?.id ?? null);
              }}
              onInputChange={(_, value) => setSearchText(value)}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Bill-to Target"
                  helperText={
                    errors.billToId ??
                    "Search by name, code, or contact details."
                  }
                  error={Boolean(errors.billToId)}
                />
              )}
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Invoice Dates
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Invoice Date"
                type="date"
                value={form.invoiceDate}
                onChange={(event) =>
                  updateField("invoiceDate", event.target.value)
                }
                error={Boolean(errors.invoiceDate)}
                helperText={errors.invoiceDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
                error={Boolean(errors.dueDate)}
                helperText={errors.dueDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Billing Period Start"
                type="date"
                value={form.billingPeriodStart ?? ""}
                onChange={(event) =>
                  updateField("billingPeriodStart", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Billing Period End"
                type="date"
                value={form.billingPeriodEnd ?? ""}
                onChange={(event) =>
                  updateField("billingPeriodEnd", event.target.value)
                }
                error={Boolean(errors.billingPeriodEnd)}
                helperText={errors.billingPeriodEnd}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Totals and Notes
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Tax Amount"
                type="number"
                value={form.taxAmount}
                onChange={(event) =>
                  updateField("taxAmount", Number(event.target.value) || 0)
                }
                error={Boolean(errors.taxAmount)}
                helperText={errors.taxAmount}
                fullWidth
              />
              <TextField
                label="Discount Amount"
                type="number"
                value={form.discountAmount}
                onChange={(event) =>
                  updateField("discountAmount", Number(event.target.value) || 0)
                }
                error={Boolean(errors.discountAmount)}
                helperText={errors.discountAmount}
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
            </Stack>
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
          {loading ? "Saving..." : invoice ? "Save Invoice" : "Create Invoice"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
