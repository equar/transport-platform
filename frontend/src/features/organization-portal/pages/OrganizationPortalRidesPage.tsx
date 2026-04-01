import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
  Alert,
  Box,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { formatDateTime } from "../../../shared/utils/format";
import {
  organizationPortalApi,
  type OrganizationPortalDashboardRecord,
  type OrganizationPortalRideRecord,
} from "../api/organizationPortalApi";

const rideStatuses = [
  "",
  "REQUESTED",
  "SCHEDULED",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;

export function OrganizationPortalRidesPage() {
  const [dashboard, setDashboard] =
    useState<OrganizationPortalDashboardRecord | null>(null);
  const [rides, setRides] = useState<OrganizationPortalRideRecord[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, ridesResponse] = await Promise.all([
          organizationPortalApi.getDashboard(),
          organizationPortalApi.searchRides({
            status: status || undefined,
            size: 25,
            sortBy: "scheduledPickupAt",
            sortDirection: "ASC",
          }),
        ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setRides(ridesResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError("Scheduled rides could not be loaded.");
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
  }, [status]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">Scheduled Rides</Typography>
          <Typography color="text.secondary">
            Review upcoming service activity for riders tied to your
            organization scope.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {dashboard ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Upcoming Rides"
              value={dashboard.upcomingRideCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<GroupsRoundedIcon color="primary" />}
              label="Linked Riders"
              value={dashboard.linkedRiderCount}
            />
          </Box>
        </Box>
      ) : null}
      <PageCard>
        <TextField
          select
          label="Ride status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          sx={{ minWidth: { md: 220 } }}
        >
          {rideStatuses.map((option) => (
            <MenuItem key={option || "all-rides"} value={option}>
              {option || "All ride statuses"}
            </MenuItem>
          ))}
        </TextField>
      </PageCard>
      <Stack spacing={2}>
        {rides.length === 0 ? (
          <PageCard>
            <Typography color="text.secondary">
              No rides match the current filter.
            </Typography>
          </PageCard>
        ) : (
          rides.map((ride) => (
            <PageCard key={ride.id}>
              <Stack spacing={1.1}>
                <Typography variant="h6">{ride.rideNumber}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pickup: {formatDateTime(ride.scheduledPickupAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rider: {ride.riderName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From: {ride.pickupAddress || "Pickup address pending"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  To: {ride.dropoffAddress || "Dropoff address pending"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {ride.status.replaceAll("_", " ")}
                </Typography>
              </Stack>
            </PageCard>
          ))
        )}
      </Stack>
    </Stack>
  );
}
