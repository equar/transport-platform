import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";
import {
  organizationPortalApi,
  type OrganizationPortalContractRecord,
  type OrganizationPortalDashboardRecord,
  type OrganizationPortalInvoiceRecord,
  type OrganizationPortalProfileRecord,
  type OrganizationPortalRideRecord,
} from "../api/organizationPortalApi";

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function OrganizationPortalHomePage() {
  const [dashboard, setDashboard] =
    useState<OrganizationPortalDashboardRecord | null>(null);
  const [profile, setProfile] =
    useState<OrganizationPortalProfileRecord | null>(null);
  const [rides, setRides] = useState<OrganizationPortalRideRecord[]>([]);
  const [contracts, setContracts] = useState<
    OrganizationPortalContractRecord[]
  >([]);
  const [invoices, setInvoices] = useState<OrganizationPortalInvoiceRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPortal() {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboardResponse,
        profileResponse,
        ridesResponse,
        contractsResponse,
        invoicesResponse,
      ] = await Promise.all([
        organizationPortalApi.getDashboard(),
        organizationPortalApi.getProfile(),
        organizationPortalApi.searchRides({
          size: 5,
          sortBy: "scheduledPickupAt",
          sortDirection: "ASC",
        }),
        organizationPortalApi.searchContracts({
          size: 5,
          sortBy: "updatedAt",
          sortDirection: "DESC",
        }),
        organizationPortalApi.searchInvoices({
          size: 5,
          sortBy: "invoiceDate",
          sortDirection: "DESC",
        }),
      ]);
      setDashboard(dashboardResponse);
      setProfile(profileResponse);
      setRides(ridesResponse.items);
      setContracts(contractsResponse.items);
      setInvoices(invoicesResponse.items);
    } catch {
      setError("The organization portal could not be loaded.");
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

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1.25}>
          <Typography variant="overline" color="secondary.main">
            Client workspace
          </Typography>
          <Typography variant="h3">
            Track riders, service activity, contracts, billing, and
            notifications in one place.
          </Typography>
          <Typography color="text.secondary">
            Everything shown here is limited to the current organization scope
            so business users can review service activity without crossing into
            tenant administration.
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
              xl: "repeat(6, minmax(0, 1fr))",
            },
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
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Upcoming Rides"
              value={dashboard.upcomingRideCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Active Contracts"
              value={dashboard.activeContractCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
              label="Open Invoices"
              value={dashboard.openInvoiceCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
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
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.1fr 0.9fr",
          },
        }}
      >
        <PageCard>
          <Stack spacing={2}>
            <Stack spacing={0.75}>
              <Typography variant="h5">Scheduled rides</Typography>
              <Typography color="text.secondary">
                Upcoming rides already scoped to this organization account.
              </Typography>
            </Stack>
            {rides.length === 0 ? (
              <Typography color="text.secondary">
                No upcoming rides are visible right now.
              </Typography>
            ) : (
              rides.map((ride) => (
                <PageCard key={ride.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack spacing={1.1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="h6">{ride.rideNumber}</Typography>
                      <StatusChip
                        value={ride.status}
                        sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Pickup: {formatDateTime(ride.scheduledPickupAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rider: {ride.riderName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From: {ride.pickupAddress || "Pickup address pending"}
                    </Typography>
                  </Stack>
                </PageCard>
              ))
            )}
            <Button
              component={RouterLink}
              to="/portal/organization/rides"
              variant="outlined"
            >
              View scheduled rides
            </Button>
          </Stack>
        </PageCard>

        <Stack spacing={2}>
          {profile ? (
            <PageCard>
              <Stack spacing={1.25}>
                <Typography variant="h5">Organization profile</Typography>
                <Typography color="text.secondary">
                  {profile.organizationName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Primary contact: {profile.firstName} {profile.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contact email: {profile.email ?? profile.primaryEmail ?? "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated {formatDateTime(profile.updatedAt)}
                </Typography>
                <Button
                  component={RouterLink}
                  to="/portal/organization/profile"
                  variant="contained"
                >
                  Manage profile
                </Button>
              </Stack>
            </PageCard>
          ) : null}

          <PageCard>
            <Stack spacing={1.5}>
              <Typography variant="h5">Contracts snapshot</Typography>
              {contracts.length === 0 ? (
                <Typography color="text.secondary">
                  No active contracts are visible right now.
                </Typography>
              ) : (
                contracts.slice(0, 3).map((contract) => (
                  <Stack key={contract.id} spacing={0.75}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography fontWeight={700}>
                        {contract.contractName}
                      </Typography>
                      <StatusChip
                        value={contract.status}
                        sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {contract.contractCode} • {contract.billingModel}
                    </Typography>
                  </Stack>
                ))
              )}
              <Button
                component={RouterLink}
                to="/portal/organization/contracts"
                variant="outlined"
              >
                Review contracts
              </Button>
            </Stack>
          </PageCard>

          <PageCard>
            <Stack spacing={1.5}>
              <Typography variant="h5">Billing snapshot</Typography>
              {invoices.length === 0 ? (
                <Typography color="text.secondary">
                  No invoices are visible right now.
                </Typography>
              ) : (
                invoices.slice(0, 3).map((invoice) => (
                  <Stack key={invoice.id} spacing={0.35}>
                    <Typography fontWeight={700}>
                      {invoice.invoiceNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due {formatDate(invoice.dueDate)} • Balance{" "}
                      {formatCurrency(invoice.balanceDue, invoice.currency)}
                    </Typography>
                  </Stack>
                ))
              )}
              <Button
                component={RouterLink}
                to="/portal/organization/billing"
                variant="outlined"
              >
                Open billing
              </Button>
            </Stack>
          </PageCard>
        </Stack>
      </Box>
    </Stack>
  );
}
