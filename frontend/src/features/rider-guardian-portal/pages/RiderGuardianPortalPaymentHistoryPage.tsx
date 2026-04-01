import { Alert, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { StatusChip } from "../../../shared/components/StatusChip";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalPaymentRecord,
} from "../api/riderGuardianPortalApi";

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

export function RiderGuardianPortalPaymentHistoryPage() {
  const [payments, setPayments] = useState<RiderGuardianPortalPaymentRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      setLoading(true);
      setError(null);
      try {
        const response = await riderGuardianPortalApi.searchPayments({
          size: 50,
          sortBy: "paymentDate",
          sortDirection: "DESC",
        });
        if (!cancelled) {
          setPayments(response.items);
        }
      } catch {
        if (!cancelled) {
          setError("Payment history could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPayments();

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
          <Typography variant="h4">Payment History</Typography>
          <Typography color="text.secondary">
            Recent posted payments already visible to your scoped rider or
            guardian billing access.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {payments.length === 0 ? (
        <PageCard>
          <Typography color="text.secondary">
            No payments are currently visible.
          </Typography>
        </PageCard>
      ) : (
        payments.map((payment) => (
          <PageCard key={payment.id}>
            <Stack spacing={1.25}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Stack spacing={0.5}>
                  <Typography variant="h6">{payment.paymentNumber}</Typography>
                  <Typography color="text.secondary">
                    {payment.billToNameSnapshot ?? "Current portal scope"}
                  </Typography>
                </Stack>
                <StatusChip
                  value={payment.status}
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
              <Typography variant="body2" color="text.secondary">
                Amount: {formatAmount(payment.amount)}
              </Typography>
            </Stack>
          </PageCard>
        ))
      )}
    </Stack>
  );
}
