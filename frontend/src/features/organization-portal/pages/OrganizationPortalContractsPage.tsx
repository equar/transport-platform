import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
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
  organizationPortalApi,
  type OrganizationPortalContractRecord,
  type OrganizationPortalDashboardRecord,
  type OrganizationPortalRideRecord,
} from "../api/organizationPortalApi";

const contractStatuses = [
  "",
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "TERMINATED",
  "INACTIVE",
] as const;
const rideStatuses = [
  "",
  "REQUESTED",
  "SCHEDULED",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function OrganizationPortalContractsPage() {
  const [dashboard, setDashboard] =
    useState<OrganizationPortalDashboardRecord | null>(null);
  const [contracts, setContracts] = useState<
    OrganizationPortalContractRecord[]
  >([]);
  const [rides, setRides] = useState<OrganizationPortalRideRecord[]>([]);
  const [contractStatus, setContractStatus] = useState("");
  const [rideStatus, setRideStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, contractsResponse, ridesResponse] =
          await Promise.all([
            organizationPortalApi.getDashboard(),
            organizationPortalApi.searchContracts({
              status: contractStatus || undefined,
              size: 25,
              sortBy: "updatedAt",
              sortDirection: "DESC",
            }),
            organizationPortalApi.searchRides({
              status: rideStatus || undefined,
              size: 25,
              sortBy: "scheduledPickupAt",
              sortDirection: "ASC",
            }),
          ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setContracts(contractsResponse.items);
          setRides(ridesResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Organization contracts and service activity could not be loaded.",
          );
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
  }, [contractStatus, rideStatus]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Contracts And Service"
        description="Review visible agreements and upcoming ride activity for the organization scope."
      />
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
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Active Contracts"
              value={dashboard.activeContractCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Upcoming Rides"
              value={dashboard.upcomingRideCount}
            />
          </Box>
        </Box>
      ) : null}
      <PageCard>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            label="Contract status"
            value={contractStatus}
            onChange={(event) => setContractStatus(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            {contractStatuses.map((option) => (
              <MenuItem key={option || "all-contracts"} value={option}>
                {option || "All contract statuses"}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Ride status"
            value={rideStatus}
            onChange={(event) => setRideStatus(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            {rideStatuses.map((option) => (
              <MenuItem key={option || "all-rides"} value={option}>
                {option || "All ride statuses"}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Contracts"
            title="Visible Agreements"
            description="Contracts currently available to this organization portal user."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Contract</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Billing</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>
                      {contract.contractName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contract.contractCode}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{contract.contractType}</TableCell>
                <TableCell>{contract.billingModel}</TableCell>
                <TableCell>
                  {formatDate(contract.startDate)} -{" "}
                  {formatDate(contract.endDate)}
                </TableCell>
                <TableCell>
                  <StatusChip value={contract.status} />
                </TableCell>
              </TableRow>
            ))}
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No contracts match the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Service activity"
            title="Visible Rides"
            description="The latest organization-scoped ride activity."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ride</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Rider</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{ride.rideNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ride.pickupAddress || "Pickup address pending"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{formatDateTime(ride.scheduledPickupAt)}</TableCell>
                <TableCell>{ride.riderName}</TableCell>
                <TableCell>
                  <StatusChip value={ride.status} />
                </TableCell>
              </TableRow>
            ))}
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
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
