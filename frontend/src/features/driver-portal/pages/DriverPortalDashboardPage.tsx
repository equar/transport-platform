import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TwoWheelerRoundedIcon from "@mui/icons-material/TwoWheelerRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalDashboardRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { PageHero } from "../../../shared/components/PageHero";
import { BusinessErrorState } from "../../../shared/components/BusinessErrorState";
import { normalizeBusinessError, type BusinessError } from "../../../shared/api/businessError";

export function DriverPortalDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DriverPortalDashboardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusinessError | null>(null);

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
      } catch (loadError) {
        if (!cancelled) {
          setError(normalizeBusinessError(loadError, "Driver dashboard could not be loaded."));
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
      <PageHero eyebrow="Driver workspace" title="Your day, ready at a glance." description="Review assignments, confirm route readiness, and resolve compliance items before service starts.">
        <Button component={RouterLink} to="/portal/driver/rides" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>Start with my rides</Button>
        <Button component={RouterLink} to="/portal/driver/routes" variant="outlined">View today’s route</Button>
      </PageHero>
      {error ? <BusinessErrorState error={error} /> : null}
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
            {[
              ["Ride assignment", Math.min((dashboard?.assignedRides ?? 0) * 20, 100), `${dashboard?.assignedRides ?? 0} assigned`],
              ["Route readiness", (dashboard?.activeRoutesToday ?? 0) > 0 ? 100 : 15, (dashboard?.activeRoutesToday ?? 0) > 0 ? "Route available" : "Awaiting route"],
              ["Compliance readiness", Math.max(100 - (dashboard?.unresolvedComplianceIssues ?? 0) * 20, 10), `${dashboard?.unresolvedComplianceIssues ?? 0} issues`],
            ].map(([label, value, detail]) => (
              <Stack key={String(label)} spacing={0.75}>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight={700}>{label}</Typography><Typography variant="caption" color="text.secondary">{detail}</Typography></Stack>
                <LinearProgress variant="determinate" value={Number(value)} sx={{ height: 8, borderRadius: 99 }} />
              </Stack>
            ))}
          </Stack>
        </PageCard>
      </Box>
    </Stack>
  );
}
