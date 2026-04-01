import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
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
import { SectionHeader } from "../../../shared/components/SectionHeader";
import {
  formatStatusLabel,
  StatusChip,
} from "../../../shared/components/StatusChip";
import {
  organizationPortalApi,
  type OrganizationPortalContractRecord,
  type OrganizationPortalDashboardRecord,
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
  const [contractStatus, setContractStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, contractsResponse] = await Promise.all([
          organizationPortalApi.getDashboard(),
          organizationPortalApi.searchContracts({
            status: contractStatus || undefined,
            size: 25,
            sortBy: "updatedAt",
            sortDirection: "DESC",
          }),
        ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setContracts(contractsResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError("Organization contracts could not be loaded.");
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
  }, [contractStatus]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Contracts"
        description="Review the agreements already visible to your organization account. Contract visibility is read-only unless additional backend actions are introduced later."
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
                {option ? formatStatusLabel(option) : "All contract statuses"}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </PageCard>
      <Stack spacing={2}>
        {contracts.length === 0 ? (
          <PageCard>
            <Typography color="text.secondary">
              No contracts match the current filters.
            </Typography>
          </PageCard>
        ) : (
          contracts.map((contract) => (
            <PageCard key={contract.id}>
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="h6">{contract.contractName}</Typography>
                  <StatusChip
                    value={contract.status}
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {contract.contractCode} • {contract.contractType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Billing model: {contract.billingModel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active dates: {formatDate(contract.startDate)} -{" "}
                  {formatDate(contract.endDate)}
                </Typography>
              </Stack>
            </PageCard>
          ))
        )}
      </Stack>
    </Stack>
  );
}
