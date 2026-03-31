import { useEffect, useState, type ReactNode } from "react";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Link as RouterLink } from "react-router-dom";
import { isPlatformAdmin } from "../../auth/access";
import { useAuth } from "../../auth/context/AuthContext";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { RecentActivityList } from "../../../shared/components/RecentActivityList";
import {
  dashboardApi,
  type CompanyDashboardSummary,
  type PlatformDashboardSummary,
} from "../api/dashboardApi";

type SummaryCard = {
  key: string;
  label: string;
  icon: ReactNode;
  caption: string;
};

export function DashboardPage() {
  const { session } = useAuth();
  const platformAdmin = isPlatformAdmin(session);
  const [platformSummary, setPlatformSummary] =
    useState<PlatformDashboardSummary | null>(null);
  const [companySummary, setCompanySummary] =
    useState<CompanyDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const platformCards: SummaryCard[] = [
    {
      key: "totalTenants",
      label: "Total Tenants",
      icon: <GroupsRoundedIcon color="primary" />,
      caption: "Provisioned companies across the platform.",
    },
    {
      key: "activeTenants",
      label: "Active Tenants",
      icon: <ApartmentRoundedIcon color="primary" />,
      caption: "Operational companies with live access.",
    },
    {
      key: "suspendedTenants",
      label: "Suspended Tenants",
      icon: <CloseRoundedIcon color="primary" />,
      caption: "Companies paused from operational access.",
    },
    {
      key: "pendingApplications",
      label: "Pending Applications",
      icon: <AssignmentTurnedInRoundedIcon color="primary" />,
      caption: "Inbound companies awaiting review decisions.",
    },
    {
      key: "pendingUsers",
      label: "Pending Users",
      icon: <PersonAddAltRoundedIcon color="primary" />,
      caption: "User accounts still awaiting activation.",
    },
    {
      key: "activeUsers",
      label: "Active Users",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption: "Currently enabled platform and tenant users.",
    },
  ];

  const companyCards: SummaryCard[] = [
    {
      key: "totalUsers",
      label: "Total Users",
      icon: <GroupsRoundedIcon color="primary" />,
      caption: "All accounts assigned to your tenant.",
    },
    {
      key: "activeUsers",
      label: "Active Users",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption: "Accounts that can sign in and operate now.",
    },
    {
      key: "pendingUsers",
      label: "Pending Users",
      icon: <PersonAddAltRoundedIcon color="primary" />,
      caption: "Invited accounts awaiting activation.",
    },
    {
      key: "suspendedUsers",
      label: "Suspended Users",
      icon: <CloseRoundedIcon color="primary" />,
      caption: "Accounts blocked until reactivated.",
    },
    {
      key: "totalDrivers",
      label: "Total Drivers",
      icon: <BadgeRoundedIcon color="primary" />,
      caption: "Driver records currently managed by your tenant.",
    },
    {
      key: "activeDrivers",
      label: "Active Drivers",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption: "Drivers currently ready for future operational assignment.",
    },
    {
      key: "driversPendingReview",
      label: "Drivers Pending Review",
      icon: <AssignmentTurnedInRoundedIcon color="primary" />,
      caption: "Drivers still moving through onboarding review.",
    },
    {
      key: "driversWithExpiredDocuments",
      label: "Expired Driver Documents",
      icon: <DescriptionRoundedIcon color="primary" />,
      caption: "Drivers carrying at least one expired compliance document.",
    },
    {
      key: "driversMissingRequiredDocuments",
      label: "Missing Required Documents",
      icon: <ShieldRoundedIcon color="primary" />,
      caption: "Drivers still missing required compliance documents.",
    },
  ];

  useEffect(() => {
    let active = true;
    const request = platformAdmin
      ? dashboardApi.getPlatformSummary()
      : dashboardApi.getCompanySummary();

    request
      .then((response) => {
        if (active) {
          if (platformAdmin) {
            setPlatformSummary(response as PlatformDashboardSummary);
            setCompanySummary(null);
          } else {
            setCompanySummary(response as CompanyDashboardSummary);
            setPlatformSummary(null);
          }
          setError(null);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            platformAdmin
              ? "Platform dashboard data could not be loaded."
              : "Company dashboard data could not be loaded.",
          );
          setPlatformSummary(null);
          setCompanySummary(null);
        }
      });

    return () => {
      active = false;
    };
  }, [platformAdmin]);

  const summaryCards = platformAdmin ? platformCards : companyCards;
  const summary = platformAdmin ? platformSummary : companySummary;
  const recentActivity = summary?.recentActivity ?? [];

  return (
    <Stack spacing={3}>
      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            {platformAdmin ? "Platform Dashboard" : "Company Dashboard"}
          </Typography>
          <Typography variant="h3">
            {platformAdmin
              ? "Tenant onboarding, identity governance, and company intake are visible in one control surface."
              : "Your tenant’s access posture is centralized in one company-admin workspace."}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {platformAdmin
              ? "Track application demand, tenant activation, and user lifecycle health across the platform."
              : "Track user activity, driver onboarding, document readiness, and administrative changes for your tenant."}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {platformAdmin ? (
              <>
                <Button
                  component={RouterLink}
                  to="/platform/company-applications"
                  variant="contained"
                >
                  Review Company Applications
                </Button>
                <Button
                  component={RouterLink}
                  to="/platform/users"
                  variant="outlined"
                >
                  Manage Users
                </Button>
                <Button
                  component={RouterLink}
                  to="/platform/audit-logs"
                  variant="text"
                >
                  Review Audit Logs
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/company/users"
                  variant="contained"
                >
                  Manage Users
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/drivers"
                  variant="outlined"
                >
                  Review Drivers
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/drivers"
                  variant="text"
                >
                  Manage Driver Documents
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/audit-logs"
                  variant="text"
                >
                  Review Audit Logs
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </PageCard>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        {summaryCards.map((card) => (
          <MetricCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            caption={card.caption}
            value={
              summary ? (
                String(summary[card.key as keyof typeof summary] ?? 0)
              ) : (
                <Skeleton width={56} />
              )
            }
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.4fr) minmax(320px, 0.9fr)",
          },
        }}
      >
        <RecentActivityList
          title={
            platformAdmin
              ? "Recent Platform Activity"
              : "Recent Company Activity"
          }
          description={
            platformAdmin
              ? "Recent tenant, user, and application governance changes across the platform."
              : "Recent tenant-scoped user, role, and onboarding activity captured for your company."
          }
          items={recentActivity}
        />
        <PageCard>
          <Stack spacing={2.5}>
            <Stack spacing={0.5}>
              <Typography variant="h5">Control Priorities</Typography>
              <Typography color="text.secondary">
                {platformAdmin
                  ? "Use the highest-signal work queues to keep onboarding, access, and compliance moving."
                  : "Use the highest-signal work queues to keep tenant access and governance current."}
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {platformAdmin ? (
                <>
                  <Button
                    component={RouterLink}
                    to="/platform/tenants"
                    variant="contained"
                    startIcon={<ApartmentRoundedIcon />}
                  >
                    Review Tenant Portfolio
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/platform/company-applications"
                    variant="outlined"
                    startIcon={<AssignmentTurnedInRoundedIcon />}
                  >
                    Clear Application Queue
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/platform/audit-logs"
                    variant="outlined"
                    startIcon={<ShieldRoundedIcon />}
                  >
                    Inspect Governance Trail
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/company/users"
                    variant="contained"
                    startIcon={<GroupsRoundedIcon />}
                  >
                    Review Tenant Users
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/drivers"
                    variant="outlined"
                    startIcon={<BadgeRoundedIcon />}
                  >
                    Create Driver
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/drivers"
                    variant="outlined"
                    startIcon={<DescriptionRoundedIcon />}
                  >
                    Manage Driver Documents
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/audit-logs"
                    variant="outlined"
                    startIcon={<ShieldRoundedIcon />}
                  >
                    Inspect Audit Trail
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </PageCard>
      </Box>
    </Stack>
  );
}
