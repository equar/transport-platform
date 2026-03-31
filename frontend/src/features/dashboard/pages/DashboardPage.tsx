import { useEffect, useState, type ReactNode } from "react";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AccessibleRoundedIcon from "@mui/icons-material/AccessibleRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import BuildCircleRoundedIcon from "@mui/icons-material/BuildCircleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
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
      key: "totalRiders",
      label: "Total Riders",
      icon: <AccessibleRoundedIcon color="primary" />,
      caption: "Rider records currently managed by your tenant.",
    },
    {
      key: "activeRiders",
      label: "Active Riders",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption:
        "Riders currently ready for future scheduling and dispatch workflows.",
    },
    {
      key: "waitlistedRiders",
      label: "Waitlisted Riders",
      icon: <AssignmentTurnedInRoundedIcon color="primary" />,
      caption: "Riders intentionally held in a waitlisted onboarding state.",
    },
    {
      key: "ridersRequiringWheelchairSupport",
      label: "Wheelchair Support Riders",
      icon: <AccessibleRoundedIcon color="primary" />,
      caption: "Riders flagged for wheelchair support readiness.",
    },
    {
      key: "ridersRequiringEscort",
      label: "Escort Support Riders",
      icon: <ContactPhoneRoundedIcon color="primary" />,
      caption: "Riders who require an escort for future operations.",
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
    {
      key: "totalVehicles",
      label: "Total Vehicles",
      icon: <DirectionsCarFilledRoundedIcon color="primary" />,
      caption: "Vehicle records currently managed by your tenant.",
    },
    {
      key: "activeVehicles",
      label: "Active Vehicles",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption: "Vehicles currently ready for future operational assignment.",
    },
    {
      key: "vehiclesInMaintenance",
      label: "Vehicles in Maintenance",
      icon: <BuildCircleRoundedIcon color="primary" />,
      caption:
        "Vehicles intentionally withheld from service for maintenance work.",
    },
    {
      key: "vehiclesOutOfService",
      label: "Vehicles Out of Service",
      icon: <CloseRoundedIcon color="primary" />,
      caption: "Vehicles that are currently excluded from operational use.",
    },
    {
      key: "vehiclesWithExpiredDocuments",
      label: "Expired Vehicle Documents",
      icon: <DescriptionRoundedIcon color="primary" />,
      caption: "Vehicles carrying at least one expired compliance document.",
    },
    {
      key: "vehiclesMissingRequiredDocuments",
      label: "Vehicles Missing Required Documents",
      icon: <ShieldRoundedIcon color="primary" />,
      caption:
        "Vehicles still missing required registration, insurance, or inspection documents.",
    },
    {
      key: "totalRides",
      label: "Total Rides",
      icon: <CalendarMonthRoundedIcon color="primary" />,
      caption: "All ride records currently tracked by your tenant.",
    },
    {
      key: "requestedRides",
      label: "Requested Rides",
      icon: <AssignmentTurnedInRoundedIcon color="primary" />,
      caption: "Rides currently waiting in the request and review funnel.",
    },
    {
      key: "scheduledRides",
      label: "Scheduled Rides",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption: "Rides already marked ready for future dispatch and assignment.",
    },
    {
      key: "assignedRides",
      label: "Assigned Rides",
      icon: <DirectionsCarFilledRoundedIcon color="primary" />,
      caption: "Rides with driver and vehicle assignments already in place.",
    },
    {
      key: "ridesInProgress",
      label: "Rides In Progress",
      icon: <RouteRoundedIcon color="primary" />,
      caption: "Operational rides currently moving through field execution.",
    },
    {
      key: "rideExceptions",
      label: "Ride Exceptions",
      icon: <CloseRoundedIcon color="primary" />,
      caption: "No-show, missed, and failed rides requiring follow-up.",
    },
    {
      key: "cancelledRides",
      label: "Cancelled Rides",
      icon: <CloseRoundedIcon color="primary" />,
      caption: "Rides cancelled with audit-ready operational traceability.",
    },
    {
      key: "completedRides",
      label: "Completed Rides",
      icon: <CheckCircleRoundedIcon color="primary" />,
      caption: "Rides already closed out as operationally complete.",
    },
    {
      key: "totalRoutes",
      label: "Total Routes",
      icon: <RouteRoundedIcon color="primary" />,
      caption: "Route manifests created for dispatch planning and sequencing.",
    },
    {
      key: "readyRoutes",
      label: "Ready Routes",
      icon: <AssignmentTurnedInRoundedIcon color="primary" />,
      caption: "Routes that are fully staged for active dispatch execution.",
    },
    {
      key: "routesInProgress",
      label: "Routes In Progress",
      icon: <DirectionsCarFilledRoundedIcon color="primary" />,
      caption: "Routes already started and actively running in the field.",
    },
    {
      key: "totalRecurringRideSchedules",
      label: "Recurring Schedules",
      icon: <RepeatRoundedIcon color="primary" />,
      caption: "Recurring ride templates configured for automated generation.",
    },
    {
      key: "activeRecurringRideSchedules",
      label: "Active Recurring Schedules",
      icon: <RepeatRoundedIcon color="primary" />,
      caption:
        "Recurring schedules currently eligible for future ride generation.",
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
              : "Track user activity, rider readiness, guardian coverage, driver onboarding, vehicle readiness, and administrative changes for your tenant."}
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
                  to="/company/riders"
                  variant="outlined"
                >
                  Manage Riders
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/rides"
                  variant="outlined"
                >
                  Manage Rides
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/dispatch"
                  variant="contained"
                >
                  Open Dispatch Board
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/routes"
                  variant="outlined"
                >
                  Manage Routes
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/guardians"
                  variant="text"
                >
                  Manage Guardians
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/recurring-rides"
                  variant="text"
                >
                  Manage Recurring Rides
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
                  to="/company/vehicles"
                  variant="text"
                >
                  Review Vehicles
                </Button>
                <Button
                  component={RouterLink}
                  to="/company/vehicles"
                  variant="text"
                >
                  Manage Vehicle Documents
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
                  : "Use the highest-signal work queues to keep rider, fleet, and tenant governance current."}
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
                    to="/company/dispatch"
                    variant="contained"
                    startIcon={<DirectionsCarFilledRoundedIcon />}
                  >
                    Open Dispatch Board
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/routes"
                    variant="outlined"
                    startIcon={<RouteRoundedIcon />}
                  >
                    Review Routes
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/riders"
                    variant="outlined"
                    startIcon={<AccessibleRoundedIcon />}
                  >
                    Create Rider
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/guardians"
                    variant="outlined"
                    startIcon={<ContactPhoneRoundedIcon />}
                  >
                    Manage Guardians
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/users"
                    variant="outlined"
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
                    Review Drivers
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/vehicles"
                    variant="outlined"
                    startIcon={<DirectionsCarFilledRoundedIcon />}
                  >
                    Create Vehicle
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/company/vehicles"
                    variant="outlined"
                    startIcon={<DescriptionRoundedIcon />}
                  >
                    Manage Vehicle Documents
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
