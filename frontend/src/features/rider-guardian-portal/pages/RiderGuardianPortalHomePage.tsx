import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { formatDateTime } from "../../../shared/utils/format";
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
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError("The rider or guardian portal could not be loaded.");
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
      <PageCard>
        <Stack spacing={1.25}>
          <Typography variant="overline" color="secondary.main">
            {scopeLabel} workspace
          </Typography>
          <Typography variant="h3">
            See upcoming service, billing status, and account alerts in one
            place.
          </Typography>
          <Typography color="text.secondary">
            This portal keeps ride, billing, and notification visibility limited
            to the current rider or guardian scope.
          </Typography>
        </Stack>
      </PageCard>

      {error ? <Alert severity="error">{error}</Alert> : null}

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
                <PageCard key={ride.id} sx={{ p: { xs: 2, md: 2.5 } }}>
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
                    <Typography variant="body2" color="text.secondary">
                      From: {ride.pickupAddress ?? "Pending"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      To: {ride.dropoffAddress ?? "Pending"}
                    </Typography>
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
