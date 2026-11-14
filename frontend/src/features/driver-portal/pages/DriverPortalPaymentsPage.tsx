import { Alert, Chip, Stack, Typography } from "@mui/material";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { useEffect, useState } from "react";
import { driverPortalApi, type DriverEarningsSummaryRecord } from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { PageHero } from "../../../shared/components/PageHero";

export function DriverPortalPaymentsPage() {
  const [data, setData] = useState<DriverEarningsSummaryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    driverPortalApi.getPayments().then(setData).catch(() => setError("Payments could not be loaded."));
  }, []);

  if (!data && !error) return <LoadingState />;
  const money = (value: number | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: data?.currency || "USD" }).format(value || 0);

  return (
    <Stack spacing={2.5}>
      <PageHero eyebrow="Driver payments" title="Your earnings" description="Completed-trip earnings and ledger adjustments." />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {data ? (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <MetricCard icon={<PaymentsRoundedIcon color="primary" />} label="Approved earnings" value={money(data.earnedTotal)} />
            <MetricCard icon={<PaymentsRoundedIcon color="warning" />} label="Awaiting approval" value={money(data.pendingReviewTotal)} />
            <MetricCard icon={<PaymentsRoundedIcon color="warning" />} label="Awaiting calculation" value={String(data.pendingTotal)} />
          </Stack>
          <PageCard>
            <Stack spacing={1.5}>
              <Typography variant="h6">Payment history</Typography>
              {data.entries.length === 0 ? (
                <Typography color="text.secondary">No completed-trip earnings yet.</Typography>
              ) : data.entries.map(entry => {
                const status = entry.status === "PENDING_CALCULATION"
                  ? "Awaiting calculation"
                  : entry.status === "PENDING_REVIEW"
                    ? "Awaiting admin approval"
                    : "Approved";
                return (
                  <Stack key={entry.id} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography fontWeight={700}>
                        {entry.rideNumber ?? (entry.rideId ? `Trip #${entry.rideId}` : "Ledger adjustment")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.reason || entry.entryType.replace(/_/g, " ")}
                      </Typography>
                    </Stack>
                    <Stack alignItems="flex-end">
                      <Chip label={status} color={entry.status === "APPROVED" ? "success" : "warning"} />
                      <Typography variant="body2">
                        {entry.amount == null ? "Amount pending" : money(entry.amount)}
                      </Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
