import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TwoWheelerRoundedIcon from "@mui/icons-material/TwoWheelerRounded";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalDashboardRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";

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
    <Stack spacing={3}>
      <SectionHeader
        title="Driver Dashboard"
        description="Today’s work queue, route readiness, compliance visibility, and account alerts."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {dashboard ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(6, minmax(0, 1fr))",
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
      <PageCard>
        <Stack spacing={1.5}>
          <Typography variant="h5">Quick Links</Typography>
          <Typography variant="body2" color="text.secondary">
            Jump directly into your current operating areas.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Typography
              component={RouterLink}
              to="/portal/driver/rides"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Review assigned rides
            </Typography>
            <Typography
              component={RouterLink}
              to="/portal/driver/routes"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open today’s routes
            </Typography>
            <Typography
              component={RouterLink}
              to="/portal/driver/compliance"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Check compliance status
            </Typography>
          </Stack>
        </Stack>
      </PageCard>
    </Stack>
  );
}
