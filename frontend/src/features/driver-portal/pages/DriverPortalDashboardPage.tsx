import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TwoWheelerRoundedIcon from "@mui/icons-material/TwoWheelerRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalDashboardRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";

export function DriverPortalDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DriverPortalDashboardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await driverPortalApi.getDashboard();
        if (!cancelled) {
          setDashboard(response);
        }
      } catch {
        if (!cancelled) {
          setError("Driver dashboard could not be loaded.");
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
        <Stack spacing={1.5}>
          <Typography variant="overline" color="secondary.main">
            Driver workspace
          </Typography>
          <Typography variant="h3">
            Stay on top of today’s assignments.
          </Typography>
          <Typography color="text.secondary">
            Your portal keeps rides, routes, compliance, and notifications in
            one focused mobile-friendly workspace.
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
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Rides Today"
              value={dashboard.ridesToday}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<TwoWheelerRoundedIcon color="primary" />}
              label="Active Ride Queue"
              value={dashboard.assignedRides}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<RouteRoundedIcon color="primary" />}
              label="Routes Today"
              value={dashboard.activeRoutesToday}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<FactCheckRoundedIcon color="primary" />}
              label="Compliance Issues"
              value={dashboard.unresolvedComplianceIssues}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<FactCheckRoundedIcon color="primary" />}
              label="Expiring Documents"
              value={dashboard.expiringDocumentsSoon}
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
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <PageCard>
          <Stack spacing={1.5}>
            <Typography variant="h5">Priority actions</Typography>
            <Typography color="text.secondary">
              Open the areas most likely to need attention before you head into
              service.
            </Typography>
            <Button
              component={RouterLink}
              to="/portal/driver/rides"
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Review my rides
            </Button>
            <Button
              component={RouterLink}
              to="/portal/driver/routes"
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Open my routes
            </Button>
            <Button
              component={RouterLink}
              to="/portal/driver/compliance"
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Check compliance
            </Button>
          </Stack>
        </PageCard>
        <PageCard>
          <Stack spacing={1.5}>
            <Typography variant="h5">Readiness summary</Typography>
            <Typography color="text.secondary">
              Keep an eye on document expirations and unread alerts before
              starting a route.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assigned rides: {dashboard?.assignedRides ?? 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active route:{" "}
              {(dashboard?.activeRoutesToday ?? 0) > 0
                ? "Available"
                : "No active route yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compliance issues: {dashboard?.unresolvedComplianceIssues ?? 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unread notifications: {dashboard?.unreadNotifications ?? 0}
            </Typography>
          </Stack>
        </PageCard>
      </Box>
    </Stack>
  );
}
