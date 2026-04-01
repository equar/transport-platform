import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalDashboardRecord,
  type RiderGuardianPortalInvoiceRecord,
  type RiderGuardianPortalPaymentRecord,
} from "../api/riderGuardianPortalApi";

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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
              size: 6,
              sortBy: "invoiceDate",
              sortDirection: "DESC",
            }),
            riderGuardianPortalApi.searchPayments({
              size: 4,
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
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">Billing Summary</Typography>
          <Typography color="text.secondary">
            Review invoice balances and recent payments already authorized for
            your rider or guardian scope.
          </Typography>
        </Stack>
      </PageCard>
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
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <PageCard>
          <Stack spacing={2}>
            <Typography variant="h5">Open and recent invoices</Typography>
            {invoices.length === 0 ? (
              <Typography color="text.secondary">
                No invoices are visible right now.
              </Typography>
            ) : (
              invoices.map((invoice) => (
                <PageCard key={invoice.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="h6">
                        {invoice.invoiceNumber}
                      </Typography>
                      <Chip
                        label={invoice.status.replaceAll("_", " ")}
                        color="secondary"
                        sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Invoice date: {formatDate(invoice.invoiceDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {formatDate(invoice.dueDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Balance due:{" "}
                      {formatCurrency(invoice.balanceDue, invoice.currency)}
                    </Typography>
                  </Stack>
                </PageCard>
              ))
            )}
          </Stack>
        </PageCard>
        <PageCard>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Stack spacing={0.5}>
                <Typography variant="h5">Recent payments</Typography>
                <Typography color="text.secondary">
                  Posted payments already visible within your billing scope.
                </Typography>
              </Stack>
              <Button
                component={RouterLink}
                to="/portal/rider/billing/payments"
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Full payment history
              </Button>
            </Stack>
            {payments.length === 0 ? (
              <Typography color="text.secondary">
                No payments are visible right now.
              </Typography>
            ) : (
              payments.map((payment) => (
                <PageCard key={payment.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="h6">
                        {payment.paymentNumber}
                      </Typography>
                      <Chip
                        label={payment.status.replaceAll("_", " ")}
                        color="secondary"
                        sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate(payment.paymentDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invoice: {payment.invoiceNumber ?? "Not linked"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Method: {payment.paymentMethod ?? "Not provided"}
                    </Typography>
                  </Stack>
                </PageCard>
              ))
            )}
          </Stack>
        </PageCard>
      </Box>
    </Stack>
  );
}
