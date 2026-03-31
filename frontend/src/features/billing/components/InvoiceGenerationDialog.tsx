import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  billToTypeOptions,
  billingApi,
  type BillingPreviewPayload,
  type BillingPreviewRecord,
  type BillToType,
  type InvoiceGenerationPayload,
  type LookupOption,
} from "../api/billingApi";
import {
  rideTripTypeOptions,
  serviceTypeOptions,
} from "../../rides/api/ridesApi";

interface InvoiceGenerationDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onGenerated: (invoiceId: number) => void;
}

function createDefaultPayload(): InvoiceGenerationPayload {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    billToType: "RIDER",
    billToId: null,
    pricingRuleId: null,
    routeId: null,
    rideIds: [],
    serviceType: null,
    tripType: null,
    billingPeriodStart: today.toISOString().slice(0, 10),
    billingPeriodEnd: today.toISOString().slice(0, 10),
    quantity: null,
    tripCount: null,
    riderCount: null,
    invoiceDate: today.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    currency: "USD",
    taxAmount: 0,
    discountAmount: 0,
    manualOverrideAmount: null,
    manualOverrideNote: "",
    notes: "",
    manualLineItems: [],
  };
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value || 0);
}

export function InvoiceGenerationDialog({
  open,
  loading,
  onClose,
  onGenerated,
}: InvoiceGenerationDialogProps) {
  const [form, setForm] = useState<InvoiceGenerationPayload>(
    createDefaultPayload(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<BillingPreviewRecord | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [billToOptions, setBillToOptions] = useState<LookupOption[]>([]);
  const [selectedBillTo, setSelectedBillTo] = useState<LookupOption | null>(
    null,
  );
  const [billToSearchText, setBillToSearchText] = useState("");
  const [billToLoading, setBillToLoading] = useState(false);
  const [pricingRuleOptions, setPricingRuleOptions] = useState<LookupOption[]>(
    [],
  );
  const [selectedPricingRule, setSelectedPricingRule] =
    useState<LookupOption | null>(null);
  const [pricingRuleSearchText, setPricingRuleSearchText] = useState("");
  const [rideOptions, setRideOptions] = useState<LookupOption[]>([]);
  const [selectedRides, setSelectedRides] = useState<LookupOption[]>([]);
  const [rideSearchText, setRideSearchText] = useState("");
  const [rideLoading, setRideLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(createDefaultPayload());
    setErrors({});
    setPreview(null);
    setSelectedBillTo(null);
    setSelectedPricingRule(null);
    setSelectedRides([]);
    setBillToSearchText("");
    setPricingRuleSearchText("");
    setRideSearchText("");
    setRequestError(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setBillToLoading(true);
    billingApi
      .searchBillToOptions(form.billToType, billToSearchText)
      .then((response) => {
        if (active) {
          setBillToOptions(response);
        }
      })
      .finally(() => {
        if (active) {
          setBillToLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [billToSearchText, form.billToType, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    billingApi
      .searchPricingRuleOptions(pricingRuleSearchText)
      .then((response) => {
        if (active) {
          setPricingRuleOptions(response);
        }
      });
    return () => {
      active = false;
    };
  }, [open, pricingRuleSearchText]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setRideLoading(true);
    billingApi
      .searchRideOptions({
        keyword: rideSearchText,
        fromDate: form.billingPeriodStart || undefined,
        toDate: form.billingPeriodEnd || undefined,
        riderId:
          form.billToType === "RIDER"
            ? (selectedBillTo?.id ?? null)
            : undefined,
        organizationId:
          form.billToType === "ORGANIZATION"
            ? (selectedBillTo?.id ?? null)
            : undefined,
        contractId:
          form.billToType === "CONTRACT"
            ? (selectedBillTo?.id ?? null)
            : undefined,
      })
      .then((response) => {
        if (active) {
          setRideOptions(response);
        }
      })
      .finally(() => {
        if (active) {
          setRideLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    form.billToType,
    form.billingPeriodEnd,
    form.billingPeriodStart,
    open,
    rideSearchText,
    selectedBillTo,
  ]);

  function updateField<Key extends keyof InvoiceGenerationPayload>(
    field: Key,
    value: InvoiceGenerationPayload[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field as string];
      return next;
    });
    setPreview(null);
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!selectedBillTo) {
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
    if (
      form.manualOverrideAmount !== null &&
      form.manualOverrideAmount !== undefined &&
      (!form.manualOverrideNote || !form.manualOverrideNote.trim())
    ) {
      nextErrors.manualOverrideNote =
        "Manual override note is required when an override amount is supplied.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload(): InvoiceGenerationPayload {
    return {
      ...form,
      billToId: selectedBillTo?.id ?? null,
      pricingRuleId: selectedPricingRule?.id ?? null,
      rideIds: selectedRides.map((item) => item.id),
      billingPeriodStart: form.billingPeriodStart || null,
      billingPeriodEnd: form.billingPeriodEnd || null,
      currency: form.currency.trim().toUpperCase(),
      manualOverrideNote: form.manualOverrideNote?.trim() || null,
      notes: form.notes?.trim() || null,
    };
  }

  async function handlePreview() {
    if (!validate()) {
      return;
    }

    setPreviewLoading(true);
    setRequestError(null);
    try {
      const payload = buildPayload();
      const previewResponse = await billingApi.previewBilling(
        payload as BillingPreviewPayload,
      );
      setPreview(previewResponse);
    } catch {
      setRequestError("Billing preview could not be generated.");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleGenerate() {
    if (!validate()) {
      return;
    }

    setSubmitLoading(true);
    setRequestError(null);
    try {
      const invoice = await billingApi.generateInvoice(buildPayload());
      onGenerated(invoice.id);
    } catch {
      setRequestError("The invoice could not be generated.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>Generate Invoice</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {requestError ? <Alert severity="error">{requestError}</Alert> : null}
          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Billing Context
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Bill-to Type"
                value={form.billToType}
                onChange={(event) => {
                  updateField("billToType", event.target.value as BillToType);
                  setSelectedBillTo(null);
                  setSelectedRides([]);
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
                options={billToOptions}
                loading={billToLoading}
                value={selectedBillTo}
                onChange={(_, value) => {
                  setSelectedBillTo(value);
                  updateField("billToId", value?.id ?? null);
                }}
                onInputChange={(_, value) => setBillToSearchText(value)}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bill-to Target"
                    error={Boolean(errors.billToId)}
                    helperText={errors.billToId}
                  />
                )}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Autocomplete
                options={pricingRuleOptions}
                value={selectedPricingRule}
                onChange={(_, value) => {
                  setSelectedPricingRule(value);
                  updateField("pricingRuleId", value?.id ?? null);
                }}
                onInputChange={(_, value) => setPricingRuleSearchText(value)}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pricing Rule"
                    helperText="Optional. Leave blank to use the best matching active rule."
                  />
                )}
                fullWidth
              />
              <TextField
                select
                label="Service Type"
                value={form.serviceType ?? ""}
                onChange={(event) =>
                  updateField(
                    "serviceType",
                    (event.target.value ||
                      null) as InvoiceGenerationPayload["serviceType"],
                  )
                }
                fullWidth
              >
                <MenuItem value="">Any Service Type</MenuItem>
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
                      null) as InvoiceGenerationPayload["tripType"],
                  )
                }
                fullWidth
              >
                <MenuItem value="">Any Trip Type</MenuItem>
                {rideTripTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Billing Period and Selection
            </Typography>
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
            <Autocomplete
              multiple
              options={rideOptions}
              loading={rideLoading}
              value={selectedRides}
              onChange={(_, value) => {
                setSelectedRides(value);
                updateField(
                  "rideIds",
                  value.map((item) => item.id),
                );
              }}
              onInputChange={(_, value) => setRideSearchText(value)}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Selected Rides"
                  helperText="Optional. Choose rides within the billing period for ride-based draft generation."
                />
              )}
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="overline" color="secondary.main">
              Invoice Dates and Totals
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
                label="Manual Override Amount"
                type="number"
                value={form.manualOverrideAmount ?? ""}
                onChange={(event) =>
                  updateField(
                    "manualOverrideAmount",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Manual Override Note"
              value={form.manualOverrideNote ?? ""}
              onChange={(event) =>
                updateField("manualOverrideNote", event.target.value)
              }
              error={Boolean(errors.manualOverrideNote)}
              helperText={errors.manualOverrideNote}
              fullWidth
            />
            <TextField
              label="Notes"
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>

          {preview ? (
            <>
              <Divider />
              <Stack spacing={2}>
                <Typography variant="h5">Billing Preview</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Bill-to"
                    value={preview.billToName}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                  <TextField
                    label="Pricing Rule"
                    value={
                      preview.pricingRuleName ??
                      "Manual or best-match calculation"
                    }
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Subtotal"
                    value={formatCurrency(preview.subtotal, preview.currency)}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                  <TextField
                    label="Total Amount"
                    value={formatCurrency(
                      preview.totalAmount,
                      preview.currency,
                    )}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Stack>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Line Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.lineItems.map((lineItem) => (
                      <TableRow
                        key={`${lineItem.description}-${lineItem.lineNumber}`}
                        hover
                      >
                        <TableCell>{lineItem.description}</TableCell>
                        <TableCell>
                          {lineItem.chargeSourceType.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell align="right">{lineItem.quantity}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(lineItem.unitPrice, preview.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            lineItem.lineAmount,
                            preview.currency,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={loading || submitLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePreview}
          variant="outlined"
          disabled={previewLoading || submitLoading}
        >
          {previewLoading ? "Previewing..." : "Preview Billing"}
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={submitLoading}
        >
          {submitLoading ? "Generating..." : "Create Invoice"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
