import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import {
  formatStatusLabel,
  StatusChip,
} from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalDashboardRecord,
  type RiderGuardianPortalLinkedRiderRecord,
  type RiderGuardianPortalRideRecord,
} from "../api/riderGuardianPortalApi";

const rideStatuses = [
  "",
  "REQUESTED",
  "PENDING_REVIEW",
  "SCHEDULED",
  "ASSIGNED",
  "DRIVER_EN_ROUTE",
  "ARRIVED",
  "PICKED_UP",
  "DROPPED_OFF",
  "COMPLETED",
  "CANCELLED",
] as const;

export function RiderGuardianPortalRidesPage() {
  const [dashboard, setDashboard] =
    useState<RiderGuardianPortalDashboardRecord | null>(null);
  const [linkedRiders, setLinkedRiders] = useState<
    RiderGuardianPortalLinkedRiderRecord[]
  >([]);
  const [rides, setRides] = useState<RiderGuardianPortalRideRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, linkedRidersResponse, ridesResponse] =
          await Promise.all([
            riderGuardianPortalApi.getDashboard(),
            riderGuardianPortalApi.getLinkedRiders(),
            riderGuardianPortalApi.searchRides({
              keyword,
              status: status || undefined,
              size: 25,
              sortBy: "scheduledPickupAt",
              sortDirection: "ASC",
            }),
          ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setLinkedRiders(linkedRidersResponse);
          setRides(ridesResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError("Portal ride activity could not be loaded.");
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
  }, [keyword, status]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">Upcoming Rides</Typography>
          <Typography color="text.secondary">
            See upcoming rides in your current rider or guardian scope without
            exposing unrelated rider data.
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
              icon={<PeopleAltRoundedIcon color="primary" />}
              label="Linked Riders"
              value={dashboard.linkedRiderCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Upcoming Rides"
              value={dashboard.upcomingRideCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Active Queue"
              value={dashboard.activeRideCount}
            />
          </Box>
        </Box>
      ) : null}
      <PageCard>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <TextField
            label="Search rides"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            {rideStatuses.map((option) => (
              <MenuItem key={option || "all"} value={option}>
                {option ? formatStatusLabel(option) : "All statuses"}
              </MenuItem>
            ))}
          </TextField>
          <Button
            component={RouterLink}
            to="/portal/rider/rides/history"
            variant="outlined"
          >
            View ride history
          </Button>
        </Stack>
      </PageCard>
      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Linked riders in scope</Typography>
          <Stack spacing={1.25}>
            {linkedRiders.map((rider) => (
              <PageCard key={rider.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack spacing={0.75}>
                  <Typography variant="h6">{rider.riderDisplayName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rider.relationshipType ?? "Self"} · {rider.riderCode}
                  </Typography>
                </Stack>
              </PageCard>
            ))}
          </Stack>
        </Stack>
      </PageCard>
      <Stack spacing={2}>
        {rides.length === 0 ? (
          <PageCard>
            <Typography color="text.secondary">
              No rides match the current filters.
            </Typography>
          </PageCard>
        ) : (
          rides.map((ride) => (
            <PageCard key={ride.id}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{ride.rideNumber}</Typography>
                    <Typography color="text.secondary">
                      Viewing rider: {ride.riderName}
                    </Typography>
                  </Stack>
                  <StatusChip
                    value={ride.status}
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Pickup: {formatDateTime(ride.scheduledPickupAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Organization: {ride.organizationName ?? "Not provided"}
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/portal/rider/rides/${ride.id}`}
                  variant="outlined"
                  endIcon={<ArrowForwardRoundedIcon />}
                >
                  Open ride detail
                </Button>
              </Stack>
            </PageCard>
          ))
        )}
      </Stack>
    </Stack>
  );
}
