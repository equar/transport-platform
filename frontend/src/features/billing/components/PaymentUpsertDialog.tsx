import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  billingApi,
  paymentMethodOptions,
  type InvoiceRecord,
  type InvoiceSummaryRecord,
  type LookupOption,
  type PaymentPayload,
  type PaymentPreviewRecord,
  type PaymentRecord,
} from "../api/billingApi";

interface PaymentUpsertDialogProps {
  open: boolean;
  payment: PaymentRecord | null;
  initialInvoice: InvoiceRecord | InvoiceSummaryRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: PaymentPayload) => Promise<void>;
}

function defaultForm(invoiceId?: number | null): PaymentPayload {
  return {
    invoiceId: invoiceId ?? 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    paymentMethod: "ACH",
    referenceNumber: "",
    payerName: "",
    payerContact: "",
    externalTransactionId: "",
    notes: "",
    applyImmediately: true,
  };
}

export function PaymentUpsertDialog({
  open,
  payment,
  initialInvoice,
  loading,
  onClose,
  onSubmit,
}: PaymentUpsertDialogProps) {
  const [form, setForm] = useState<PaymentPayload>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoiceOptions, setInvoiceOptions] = useState<LookupOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<LookupOption | null>(
    null,
  );
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [preview, setPreview] = useState<PaymentPreviewRecord | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    setPreview(null);
    setPreviewError(null);

    if (payment) {
      const option = {
        id: payment.invoiceId,
        label: payment.invoiceNumber,
        secondaryLabel: payment.billToNameSnapshot,
      };
      setForm({
        invoiceId: payment.invoiceId,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber ?? "",
        payerName: payment.payerName ?? "",
        payerContact: payment.payerContact ?? "",
        externalTransactionId: payment.externalTransactionId ?? "",
        notes: payment.notes ?? "",
        applyImmediately: payment.status !== "RECORDED",
      });
      setSelectedInvoice(option);
      setInvoiceOptions([option]);
      setInvoiceSearch(payment.invoiceNumber);
      return;
    }

    const option = initialInvoice
      ? {
          id: initialInvoice.id,
          label: initialInvoice.invoiceNumber,
          secondaryLabel: initialInvoice.billToNameSnapshot,
        }
      : null;
    setForm(defaultForm(initialInvoice?.id ?? null));
    setSelectedInvoice(option);
    setInvoiceOptions(option ? [option] : []);
    setInvoiceSearch(option?.label ?? "");
  }, [initialInvoice, open, payment]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setOptionsLoading(true);
    billingApi
      .searchInvoices({
        keyword: invoiceSearch,
        status: "",
        agingBucket: "",
        billToType: "",
        fromDate: "",
        toDate: "",
        overdueOnly: false,
        page: 0,
        size: 25,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      })
      .then((page) => {
        if (!active) {
          return;
        }
        const next = page.items
          .filter((item) => item.status !== "DRAFT" && item.status !== "VOID")
          .map((item) => ({
            id: item.id,
            label: item.invoiceNumber,
            secondaryLabel: `${item.billToNameSnapshot} • ${item.balanceDue.toFixed(2)} ${item.currency}`,
          }));
        setInvoiceOptions((current) => {
          if (!selectedInvoice) {
            return next;
          }
          const exists = next.some((item) => item.id === selectedInvoice.id);
          return exists ? next : [selectedInvoice, ...next];
        });
      })
      .catch(() => {
        if (active) {
          setInvoiceOptions(selectedInvoice ? [selectedInvoice] : []);
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
  }, [invoiceSearch, open, selectedInvoice]);

  useEffect(() => {
    if (!open || !selectedInvoice || form.amount <= 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let active = true;
    billingApi
      .previewPayment({ invoiceId: selectedInvoice.id, amount: form.amount })
      .then((response) => {
        if (active) {
          setPreview(response);
          setPreviewError(null);
        }
      })
      .catch(() => {
        if (active) {
          setPreview(null);
          setPreviewError(
            "Payment preview could not be calculated for the selected invoice.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [form.amount, open, selectedInvoice]);

  function updateField<Key extends keyof PaymentPayload>(
    field: Key,
    value: PaymentPayload[Key],
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

    if (!selectedInvoice) {
      nextErrors.invoiceId = "Invoice is required.";
    }
    if (!form.paymentDate) {
      nextErrors.paymentDate = "Payment date is required.";
    }
    if (form.amount <= 0) {
      nextErrors.amount = "Payment amount must be greater than zero.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !selectedInvoice) {
      return;
    }

    await onSubmit({
      ...form,
      invoiceId: selectedInvoice.id,
      referenceNumber: form.referenceNumber?.trim() || null,
      payerName: form.payerName?.trim() || null,
      payerContact: form.payerContact?.trim() || null,
      externalTransactionId: form.externalTransactionId?.trim() || null,
      notes: form.notes?.trim() || null,
      applyImmediately: form.applyImmediately ?? true,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{payment ? "Update Payment" : "Record Payment"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Payment Context
            </Typography>
            <Autocomplete
              options={invoiceOptions}
              loading={optionsLoading}
              value={selectedInvoice}
              onChange={(_, value) => {
                setSelectedInvoice(value);
                updateField("invoiceId", value?.id ?? 0);
              }}
              onInputChange={(_, value) => setInvoiceSearch(value)}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invoice"
                  error={Boolean(errors.invoiceId)}
                  helperText={
                    errors.invoiceId ?? "Select an issued or open invoice."
                  }
                />
              )}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Payment Date"
                type="date"
                value={form.paymentDate}
                onChange={(event) =>
                  updateField("paymentDate", event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.paymentDate)}
                helperText={errors.paymentDate}
                fullWidth
              />
              <TextField
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(event) =>
                  updateField("amount", Number(event.target.value))
                }
                inputProps={{ min: 0, step: 0.01 }}
                error={Boolean(errors.amount)}
                helperText={errors.amount}
                fullWidth
              />
              <TextField
                select
                label="Method"
                value={form.paymentMethod}
                onChange={(event) =>
                  updateField(
                    "paymentMethod",
                    event.target.value as PaymentPayload["paymentMethod"],
                  )
                }
                fullWidth
              >
                {paymentMethodOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Payer Details
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Reference Number"
                value={form.referenceNumber ?? ""}
                onChange={(event) =>
                  updateField("referenceNumber", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="Payer Name"
                value={form.payerName ?? ""}
                onChange={(event) =>
                  updateField("payerName", event.target.value)
                }
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Payer Contact"
                value={form.payerContact ?? ""}
                onChange={(event) =>
                  updateField("payerContact", event.target.value)
                }
                fullWidth
              />
              <TextField
                label="External Transaction Id"
                value={form.externalTransactionId ?? ""}
                onChange={(event) =>
                  updateField("externalTransactionId", event.target.value)
                }
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.applyImmediately ?? true}
                  onChange={(event) =>
                    updateField("applyImmediately", event.target.checked)
                  }
                />
              }
              label="Apply immediately to the invoice balance"
            />
          </Stack>

          {preview ? (
            <Alert severity="info">
              This payment would move invoice {preview.invoiceNumber} from a
              balance of {preview.currentBalanceDue.toFixed(2)} to{" "}
              {preview.resultingBalanceDue.toFixed(2)} and leave the invoice in{" "}
              {preview.resultingInvoiceStatus.replaceAll("_", " ")} status.
            </Alert>
          ) : null}
          {previewError ? (
            <Alert severity="warning">{previewError}</Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : payment
              ? "Update Payment"
              : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
