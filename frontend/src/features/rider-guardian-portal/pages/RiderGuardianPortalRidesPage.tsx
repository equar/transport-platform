import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import {
  Alert,
  Box,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
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
    <Stack spacing={3}>
      <SectionHeader
        title="Ride Activity"
        description="Track upcoming and recent rides within the current rider or guardian scope."
      />
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
                {option || "All statuses"}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Relationship scope"
            title="Linked Riders"
            description="The riders currently visible through this portal account."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rider</TableCell>
              <TableCell>Relationship</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Support needs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {linkedRiders.map((rider) => (
              <TableRow key={rider.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>
                      {rider.riderDisplayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rider.riderCode}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{rider.relationshipType ?? "Self"}</TableCell>
                <TableCell>
                  <StatusChip value={rider.status} />
                </TableCell>
                <TableCell>
                  {rider.wheelchairRequired || rider.escortRequired
                    ? `${rider.wheelchairRequired ? "Wheelchair" : ""}${
                        rider.wheelchairRequired && rider.escortRequired
                          ? " • "
                          : ""
                      }${rider.escortRequired ? "Escort" : ""}`
                    : "Standard"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Ride feed"
            title="Visible Rides"
            description="Ride status, pickup timing, and organization context for the current scope."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ride</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Rider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Organization</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{ride.rideNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ride.pickupAddress ?? "Pickup address pending"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{formatDateTime(ride.scheduledPickupAt)}</TableCell>
                <TableCell>{ride.riderName}</TableCell>
                <TableCell>
                  <StatusChip value={ride.status} />
                </TableCell>
                <TableCell>{ride.organizationName ?? "-"}</TableCell>
              </TableRow>
            ))}
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No rides match the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PageCard>
    </Stack>
  );
}
