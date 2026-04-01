import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded";
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
  type OrganizationPortalDashboardRecord,
  type OrganizationPortalRiderRecord,
} from "../api/organizationPortalApi";

const riderStatuses = [
  "",
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "WAITLISTED",
] as const;

export function OrganizationPortalRosterPage() {
  const [dashboard, setDashboard] =
    useState<OrganizationPortalDashboardRecord | null>(null);
  const [riders, setRiders] = useState<OrganizationPortalRiderRecord[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, ridersResponse] = await Promise.all([
          organizationPortalApi.getDashboard(),
          organizationPortalApi.searchRiders({
            status: status || undefined,
            size: 25,
            sortBy: "lastName",
            sortDirection: "ASC",
          }),
        ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setRiders(ridersResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError("The organization roster could not be loaded.");
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
      <SectionHeader
        title="Rider Roster"
        description="Review the linked riders visible to your organization account and monitor support requirements without exposing tenant administration tools."
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
              icon={<BadgeRoundedIcon color="primary" />}
              label="Active Riders"
              value={dashboard.linkedRiderCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<AccessibilityNewRoundedIcon color="primary" />}
              label="Visible Roster"
              value={riders.length}
            />
          </Box>
        </Box>
      ) : null}
      <PageCard>
        <TextField
          select
          label="Rider status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          sx={{ minWidth: { md: 220 } }}
        >
          {riderStatuses.map((option) => (
            <MenuItem key={option || "all-statuses"} value={option}>
              {option ? formatStatusLabel(option) : "All rider statuses"}
            </MenuItem>
          ))}
        </TextField>
      </PageCard>
      <Stack spacing={2}>
        {riders.length === 0 ? (
          <PageCard>
            <Typography color="text.secondary">
              No riders match the current filter.
            </Typography>
          </PageCard>
        ) : (
          riders.map((rider) => (
            <PageCard key={rider.id}>
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="h6">{rider.riderDisplayName}</Typography>
                  <StatusChip
                    value={rider.status}
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {rider.riderCode} • {formatStatusLabel(rider.riderType)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Support needs:{" "}
                  {rider.wheelchairRequired || rider.escortRequired
                    ? `${rider.wheelchairRequired ? "Wheelchair" : ""}${
                        rider.wheelchairRequired && rider.escortRequired
                          ? " • "
                          : ""
                      }${rider.escortRequired ? "Escort" : ""}`
                    : "Standard"}
                </Typography>
              </Stack>
            </PageCard>
          ))
        )}
      </Stack>
    </Stack>
  );
}
