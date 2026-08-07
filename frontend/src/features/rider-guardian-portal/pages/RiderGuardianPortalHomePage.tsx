import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { PageHero } from "../../../shared/components/PageHero";
import { formatDateTime } from "../../../shared/utils/format";
import { BusinessErrorState } from "../../../shared/components/BusinessErrorState";
import { normalizeBusinessError, type BusinessError } from "../../../shared/api/businessError";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalDashboardRecord,
  type RiderGuardianPortalRideRecord,
} from "../api/riderGuardianPortalApi";

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function RiderGuardianPortalHomePage() {
  const [dashboard, setDashboard] =
    useState<RiderGuardianPortalDashboardRecord | null>(null);
  const [upcomingRides, setUpcomingRides] = useState<
    RiderGuardianPortalRideRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusinessError | null>(null);

  async function loadPortal() {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, ridesResponse] = await Promise.all([
        riderGuardianPortalApi.getDashboard(),
        riderGuardianPortalApi.searchRides({
          size: 5,
          sortBy: "scheduledPickupAt",
          sortDirection: "ASC",
        }),
      ]);
      setDashboard(dashboardResponse);
      setUpcomingRides(ridesResponse.items.slice(0, 4));
    } catch (loadError) {
      setError(normalizeBusinessError(loadError, "The rider or guardian portal could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPortal();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  const scopeLabel = dashboard?.scopeType === "GUARDIAN" ? "Guardian" : "Rider";

  return (
    <Stack spacing={2.5}>
      <PageHero eyebrow={`${scopeLabel} workspace`} title={scopeLabel === "Guardian" ? "Everyone you care for, safely in view." : "Your next ride is easy to find."} description={scopeLabel === "Guardian" ? "Track linked riders, upcoming pickups, account alerts, and billing from one reassuring view." : "Check pickup details, ride status, billing, and important service updates without the clutter."}>
        <Button component={RouterLink} to="/portal/rider/rides" variant="contained">View upcoming rides</Button>
        <Button component={RouterLink} to="/portal/rider/notifications" variant="outlined">Check updates</Button>
      </PageHero>

      {error ? <BusinessErrorState error={error} onRetry={() => void loadPortal()} /> : null}

      {dashboard ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(5, minmax(0, 1fr))",
            },
          }}
        >
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Upcoming Rides"
              value={dashboard.upcomingRideCount}
              caption={`${dashboard.activeRideCount} active right now`}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<RepeatRoundedIcon color="primary" />}
              label="Recurring Schedules"
              value={dashboard.activeRecurringScheduleCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Open Invoices"
              value={dashboard.openInvoiceCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Outstanding Balance"
              value={formatCurrency(dashboard.outstandingBalance)}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<NotificationsRoundedIcon color="primary" />}
              label="Unread Alerts"
              value={dashboard.unreadNotifications}
            />
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
        }}
      >
        <PageCard>
          <Stack spacing={2}>
            <Stack spacing={0.75}>
              <Typography variant="h5">Next rides in your scope</Typography>
              <Typography color="text.secondary">
                Guardians can clearly see which rider each trip belongs to.
                Operational details stay limited to what the portal is meant to
                expose.
              </Typography>
            </Stack>

            {upcomingRides.length === 0 ? (
              <Typography color="text.secondary">
                No upcoming rides are visible right now.
              </Typography>
            ) : (
              upcomingRides.map((ride) => (
                <PageCard key={ride.id} sx={{ p: { xs: 2, md: 2.5 }, boxShadow: "none", bgcolor: "rgba(15,76,92,.025)", borderLeft: "4px solid", borderLeftColor: "primary.main" }}>
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Typography variant="h6">{ride.rideNumber}</Typography>
                      <Chip
                        label={ride.status}
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Rider in view: {ride.riderName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pickup: {formatDateTime(ride.scheduledPickupAt)}
                    </Typography>
                    <Stack spacing={0} sx={{ position: "relative", pl: 3, py: .5, "&::before": { content: '""', position: "absolute", left: 7, top: 12, bottom: 12, width: 2, bgcolor: "divider" } }}>
                      <Typography variant="body2" sx={{ position: "relative", py: .65, "&::before": { content: '""', position: "absolute", left: -22, top: 12, width: 9, height: 9, borderRadius: "50%", bgcolor: "primary.main" } }}>Pickup · {ride.pickupAddress ?? "Pending"}</Typography>
                      <Typography variant="body2" sx={{ position: "relative", py: .65, "&::before": { content: '""', position: "absolute", left: -22, top: 12, width: 9, height: 9, borderRadius: "50%", bgcolor: "secondary.main" } }}>Drop-off · {ride.dropoffAddress ?? "Pending"}</Typography>
                    </Stack>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.25}
                    >
                      <Button
                        component={RouterLink}
                        to={`/portal/rider/rides/${ride.id}`}
                        variant="outlined"
                      >
                        Open ride detail
                      </Button>
                      <Button
                        component={RouterLink}
                        to="/portal/rider/rides/history"
                        variant="text"
                        startIcon={<HistoryRoundedIcon />}
                      >
                        Ride history
                      </Button>
                    </Stack>
                  </Stack>
                </PageCard>
              ))
            )}
          </Stack>
        </PageCard>

        <Stack spacing={2}>
          <PageCard>
            <Stack spacing={1.5}>
              <Typography variant="h5">Quick actions</Typography>
              <Button
                component={RouterLink}
                to="/portal/rider/profile"
                variant="contained"
              >
                {scopeLabel === "Guardian"
                  ? "Open my riders"
                  : "Open my profile"}
              </Button>
              <Button
                component={RouterLink}
                to="/portal/rider/rides"
                variant="outlined"
              >
                View upcoming rides
              </Button>
              <Button
                component={RouterLink}
                to="/portal/rider/billing"
                variant="outlined"
              >
                Review billing
              </Button>
              <Button
                component={RouterLink}
                to="/portal/rider/notifications"
                variant="outlined"
              >
                Open notifications
              </Button>
            </Stack>
          </PageCard>

          <PageCard>
            <Stack spacing={1.25}>
              <Typography variant="h5">Scope summary</Typography>
              <Typography variant="body2" color="text.secondary">
                Linked riders: {dashboard?.linkedRiderCount ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open invoices: {dashboard?.openInvoiceCount ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unread notifications: {dashboard?.unreadNotifications ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Outstanding balance:{" "}
                {formatCurrency(dashboard?.outstandingBalance ?? 0)}
              </Typography>
            </Stack>
          </PageCard>
        </Stack>
      </Box>
    </Stack>
  );
}
