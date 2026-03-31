import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import {
  Alert,
  Box,
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
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalDashboardRecord,
  type RiderGuardianPortalInvoiceRecord,
  type RiderGuardianPortalPaymentRecord,
} from "../api/riderGuardianPortalApi";

const invoiceStatuses = [
  "",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
] as const;
const paymentStatuses = [
  "",
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const;

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function RiderGuardianPortalBillingPage() {
  const [dashboard, setDashboard] =
    useState<RiderGuardianPortalDashboardRecord | null>(null);
  const [invoices, setInvoices] = useState<RiderGuardianPortalInvoiceRecord[]>(
    [],
  );
  const [payments, setPayments] = useState<RiderGuardianPortalPaymentRecord[]>(
    [],
  );
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, invoicesResponse, paymentsResponse] =
          await Promise.all([
            riderGuardianPortalApi.getDashboard(),
            riderGuardianPortalApi.searchInvoices({
              status: invoiceStatus || undefined,
              size: 25,
              sortBy: "invoiceDate",
              sortDirection: "DESC",
            }),
            riderGuardianPortalApi.searchPayments({
              status: paymentStatus || undefined,
              size: 25,
              sortBy: "paymentDate",
              sortDirection: "DESC",
            }),
          ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setInvoices(invoicesResponse.items);
          setPayments(paymentsResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError("Portal billing data could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [invoiceStatus, paymentStatus]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Billing"
        description="Review invoice balances and recent payments already posted for the current rider or guardian scope."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {dashboard ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <Box>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
              label="Open Invoices"
              value={dashboard.openInvoiceCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
              label="Outstanding Balance"
              value={formatCurrency(dashboard.outstandingBalance)}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<PaymentsRoundedIcon color="primary" />}
              label="Recent Payments"
              value={payments.length}
            />
          </Box>
        </Box>
      ) : null}
      <PageCard>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            label="Invoice status"
            value={invoiceStatus}
            onChange={(event) => setInvoiceStatus(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            {invoiceStatuses.map((option) => (
              <MenuItem key={option || "all-invoices"} value={option}>
                {option || "All invoice statuses"}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Payment status"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            {paymentStatuses.map((option) => (
              <MenuItem key={option || "all-payments"} value={option}>
                {option || "All payment statuses"}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </PageCard>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <PageCard sx={{ p: 0, overflow: "hidden" }}>
          <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
            <SectionHeader
              eyebrow="Invoices"
              title="Invoice History"
              description="Recent invoices and current balance status."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Invoice date</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    {formatCurrency(invoice.balanceDue, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusChip value={invoice.status} />
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">
                      No invoices match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </PageCard>
        <PageCard sx={{ p: 0, overflow: "hidden" }}>
          <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
            <SectionHeader
              eyebrow="Payments"
              title="Payment History"
              description="Recent payments already posted against visible invoices."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Payment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>{payment.paymentNumber}</TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>{payment.invoiceNumber ?? "-"}</TableCell>
                  <TableCell>{payment.paymentMethod ?? "-"}</TableCell>
                  <TableCell>{formatAmount(payment.amount)}</TableCell>
                  <TableCell>
                    <StatusChip value={payment.status} />
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">
                      No payments match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </PageCard>
      </Box>
    </Stack>
  );
}
