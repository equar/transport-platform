import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import { billingApi, type PaymentRecord } from "../api/billingApi";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function renderDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function PaymentDetailsPage() {
  const { paymentId } = useParams();
  const resolvedPaymentId = Number(paymentId);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"apply" | "void" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      const response = await billingApi.getPayment(resolvedPaymentId);
      setPayment(response);
    } catch {
      setError("Payment details could not be loaded.");
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedPaymentId) {
      setError("Payment was not found.");
      setLoading(false);
      return;
    }
    void loadPage();
  }, [resolvedPaymentId]);

  async function handleActionConfirm() {
    if (!payment || !action) {
      return;
    }
    if (action === "void" && !voidReason.trim()) {
      showError("A void reason is required.");
      return;
    }
    setActionLoading(true);
    try {
      if (action === "apply") {
        await billingApi.applyPayment(payment.id);
        showSuccess("Payment applied successfully.");
      } else {
        await billingApi.voidPayment(payment.id, voidReason.trim());
        showSuccess("Payment voided successfully.");
      }
      setAction(null);
      setVoidReason("");
      await loadPage();
    } catch {
      showError("The payment action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !payment) {
    return <Alert severity="error">{error ?? "Payment was not found."}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Receivables"
        title="Payment Details"
        description="Review manual payment context, invoice impact, and operational status before applying or voiding the payment."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/company/payments"
            color="inherit"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Back to Payments
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/company/invoices/${payment.invoiceId}`)}
          >
            Open Invoice
          </Button>
          {payment.status === "RECORDED" ? (
            <Button
              variant="contained"
              startIcon={<PublishRoundedIcon />}
              onClick={() => setAction("apply")}
            >
              Apply Payment
            </Button>
          ) : null}
          {payment.status !== "VOID" ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockRoundedIcon />}
              onClick={() => setAction("void")}
            >
              Void Payment
            </Button>
          ) : null}
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Payment Number"
              value={payment.paymentNumber}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Status"
              value={payment.status.replaceAll("_", " ")}
              InputProps={{
                readOnly: true,
                startAdornment: <StatusChip value={payment.status} />,
              }}
              fullWidth
            />
            <TextField
              label="Method"
              value={payment.paymentMethod.replaceAll("_", " ")}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Invoice"
              value={`${payment.invoiceNumber} • ${payment.billToNameSnapshot}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Invoice Status"
              value={payment.invoiceStatus.replaceAll("_", " ")}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Payment Date"
              value={renderDate(payment.paymentDate)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Financial Impact</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Payment Amount"
              value={formatCurrency(payment.amount)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Invoice Total"
              value={formatCurrency(payment.invoiceTotalAmount)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Invoice Amount Paid"
              value={formatCurrency(payment.invoiceAmountPaid)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Invoice Balance Due"
              value={formatCurrency(payment.invoiceBalanceDue)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Reference and Audit Metadata</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Reference Number"
              value={payment.referenceNumber ?? "-"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Payer Name"
              value={payment.payerName ?? "-"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Payer Contact"
              value={payment.payerContact ?? "-"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="External Transaction Id"
              value={payment.externalTransactionId ?? "-"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Void Reason"
              value={payment.voidReason ?? "-"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Notes"
            value={payment.notes ?? "-"}
            InputProps={{ readOnly: true }}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Created By"
              value={payment.createdBy}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Created At"
              value={formatDateTime(payment.createdAt)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Updated By"
              value={payment.updatedBy}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Updated At"
              value={formatDateTime(payment.updatedAt)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </PageCard>

      <ConfirmDialog
        open={action !== null}
        title={action === "apply" ? "Apply payment" : "Void payment"}
        description={
          action === "apply"
            ? "Applying this payment will recalculate the invoice balance and mark the payment as applied."
            : "Voiding this payment will preserve the audit trail and reverse the invoice balance impact if it has already been applied."
        }
        confirmLabel={action === "apply" ? "Apply Payment" : "Void Payment"}
        loading={actionLoading}
        onCancel={() => {
          setAction(null);
          setVoidReason("");
        }}
        onConfirm={() => void handleActionConfirm()}
      >
        {action === "void" ? (
          <TextField
            label="Void Reason"
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            multiline
            minRows={3}
            fullWidth
            sx={{ mt: 2 }}
          />
        ) : null}
      </ConfirmDialog>
    </Stack>
  );
}
