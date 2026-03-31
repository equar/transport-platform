import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { AppShell } from "../layouts/AppShell";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import { AuditLogsPage } from "../../features/audit/pages/AuditLogsPage";
import { useAuth } from "../../features/auth/context/AuthContext";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { ProtectedRoute } from "../../features/auth/routes/ProtectedRoute";
import {
  isCompanyAdmin,
  isDriverPortalUser,
  isGuardianPortalUser,
  isOrganizationPortalUser,
  isPlatformAdmin,
  isRiderPortalUser,
} from "../../features/auth/access";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { InvoiceDetailsPage } from "../../features/billing/pages/InvoiceDetailsPage";
import { InvoiceManagementPage } from "../../features/billing/pages/InvoiceManagementPage";
import { PaymentDetailsPage } from "../../features/billing/pages/PaymentDetailsPage";
import { PaymentManagementPage } from "../../features/billing/pages/PaymentManagementPage";
import { PricingRuleDetailsPage } from "../../features/billing/pages/PricingRuleDetailsPage";
import { PricingRuleManagementPage } from "../../features/billing/pages/PricingRuleManagementPage";
import { ReceivablesManagementPage } from "../../features/billing/pages/ReceivablesManagementPage";
import { DispatchBoardPage } from "../../features/dispatch/pages/DispatchBoardPage";
import { DriverDetailsPage } from "../../features/drivers/pages/DriverDetailsPage";
import { DriverManagementPage } from "../../features/drivers/pages/DriverManagementPage";
import { GuardianDetailsPage } from "../../features/guardians/pages/GuardianDetailsPage";
import { GuardianManagementPage } from "../../features/guardians/pages/GuardianManagementPage";
import { RecurringRideDetailsPage } from "../../features/rides/pages/RecurringRideDetailsPage";
import { RecurringRideManagementPage } from "../../features/rides/pages/RecurringRideManagementPage";
import { RideDetailsPage } from "../../features/rides/pages/RideDetailsPage";
import { RideManagementPage } from "../../features/rides/pages/RideManagementPage";
import { RiderDetailsPage } from "../../features/riders/pages/RiderDetailsPage";
import { RiderManagementPage } from "../../features/riders/pages/RiderManagementPage";
import { VehicleDetailsPage } from "../../features/vehicles/pages/VehicleDetailsPage";
import { VehicleManagementPage } from "../../features/vehicles/pages/VehicleManagementPage";
import { TenantManagementPage } from "../../features/tenants/pages/TenantManagementPage";
import { RouteDetailsPage } from "../../features/routes/pages/RouteDetailsPage";
import { RouteManagementPage } from "../../features/routes/pages/RouteManagementPage";
import { CompanyApplicationsPage } from "../../features/company-applications/pages/CompanyApplicationsPage";
import { PublicCompanyApplicationPage } from "../../features/company-applications/pages/PublicCompanyApplicationPage";
import { RoleManagementPage } from "../../features/roles/pages/RoleManagementPage";
import { UserManagementPage } from "../../features/users/pages/UserManagementPage";
import { NotificationCenterPage } from "../../features/notifications/pages/NotificationCenterPage";
import { NotificationTemplateManagementPage } from "../../features/notifications/pages/NotificationTemplateManagementPage";
import { ComplianceDashboardPage } from "../../features/compliance/pages/ComplianceDashboardPage";
import { IncidentManagementPage } from "../../features/incidents/pages/IncidentManagementPage";
import { CompanyReportsPage } from "../../features/reports/pages/CompanyReportsPage";
import { CompanySettingsPage } from "../../features/settings/pages/CompanySettingsPage";
import { DriverPortalDashboardPage } from "../../features/driver-portal/pages/DriverPortalDashboardPage";
import { DriverPortalProfilePage } from "../../features/driver-portal/pages/DriverPortalProfilePage";
import { DriverPortalCompliancePage } from "../../features/driver-portal/pages/DriverPortalCompliancePage";
import { DriverPortalRidesPage } from "../../features/driver-portal/pages/DriverPortalRidesPage";
import { DriverPortalRideDetailsPage } from "../../features/driver-portal/pages/DriverPortalRideDetailsPage";
import { DriverPortalRoutesPage } from "../../features/driver-portal/pages/DriverPortalRoutesPage";
import { DriverPortalRouteDetailsPage } from "../../features/driver-portal/pages/DriverPortalRouteDetailsPage";
import { RiderGuardianPortalBillingPage } from "../../features/rider-guardian-portal/pages/RiderGuardianPortalBillingPage";
import { RiderGuardianPortalHomePage } from "../../features/rider-guardian-portal/pages/RiderGuardianPortalHomePage";
import { RiderGuardianPortalProfilePage } from "../../features/rider-guardian-portal/pages/RiderGuardianPortalProfilePage";
import { RiderGuardianPortalRidesPage } from "../../features/rider-guardian-portal/pages/RiderGuardianPortalRidesPage";
import { OrganizationPortalBillingPage } from "../../features/organization-portal/pages/OrganizationPortalBillingPage";
import { OrganizationPortalContractsPage } from "../../features/organization-portal/pages/OrganizationPortalContractsPage";
import { OrganizationPortalHomePage } from "../../features/organization-portal/pages/OrganizationPortalHomePage";
import { OrganizationPortalProfilePage } from "../../features/organization-portal/pages/OrganizationPortalProfilePage";
import { OrganizationPortalRosterPage } from "../../features/organization-portal/pages/OrganizationPortalRosterPage";
import { FeatureFlagManagementPage } from "../../features/saas/pages/FeatureFlagManagementPage";
import { SubscriptionPlanManagementPage } from "../../features/saas/pages/SubscriptionPlanManagementPage";
import { TenantSubscriptionManagementPage } from "../../features/saas/pages/TenantSubscriptionManagementPage";

function HomeRedirect() {
  const { isAuthenticated, isLoading, getDefaultRoute } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRoute()} replace />;
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/apply",
        element: <PublicCompanyApplicationPage />,
      },
      {
        path: "/unauthorized",
        element: <UnauthorizedPage />,
      },
    ],
  },
  {
    path: "/platform",
    element: (
      <ProtectedRoute
        allowedRoles={["ROLE_PLATFORM_ADMIN"]}
        authorize={(session) => isPlatformAdmin(session)}
      >
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "tenants",
        element: <TenantManagementPage />,
      },
      {
        path: "company-applications",
        element: <CompanyApplicationsPage />,
      },
      {
        path: "users",
        element: <UserManagementPage />,
      },
      {
        path: "subscription-plans",
        element: <SubscriptionPlanManagementPage />,
      },
      {
        path: "tenant-subscriptions",
        element: <TenantSubscriptionManagementPage />,
      },
      {
        path: "feature-flags",
        element: <FeatureFlagManagementPage />,
      },
      {
        path: "roles",
        element: <RoleManagementPage />,
      },
      {
        path: "audit-logs",
        element: <AuditLogsPage />,
      },
    ],
  },
  {
    path: "/company",
    element: (
      <ProtectedRoute
        allowedRoles={["ROLE_TENANT_ADMIN"]}
        authorize={(session) =>
          isCompanyAdmin(session) && Boolean(session?.identity.tenantId)
        }
      >
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "users",
        element: <UserManagementPage />,
      },
      {
        path: "notifications",
        element: <NotificationCenterPage />,
      },
      {
        path: "notification-templates",
        element: <NotificationTemplateManagementPage />,
      },
      {
        path: "compliance",
        element: <ComplianceDashboardPage />,
      },
      {
        path: "incidents",
        element: <IncidentManagementPage />,
      },
      {
        path: "reports",
        element: <CompanyReportsPage />,
      },
      {
        path: "settings",
        element: <CompanySettingsPage />,
      },
      {
        path: "riders",
        element: <RiderManagementPage />,
      },
      {
        path: "riders/:riderId",
        element: <RiderDetailsPage />,
      },
      {
        path: "rides",
        element: <RideManagementPage />,
      },
      {
        path: "dispatch",
        element: <DispatchBoardPage />,
      },
      {
        path: "routes",
        element: <RouteManagementPage />,
      },
      {
        path: "routes/:routeId",
        element: <RouteDetailsPage />,
      },
      {
        path: "rides/:rideId",
        element: <RideDetailsPage />,
      },
      {
        path: "recurring-rides",
        element: <RecurringRideManagementPage />,
      },
      {
        path: "recurring-rides/:recurrenceId",
        element: <RecurringRideDetailsPage />,
      },
      {
        path: "guardians",
        element: <GuardianManagementPage />,
      },
      {
        path: "guardians/:guardianId",
        element: <GuardianDetailsPage />,
      },
      {
        path: "drivers",
        element: <DriverManagementPage />,
      },
      {
        path: "drivers/:driverId",
        element: <DriverDetailsPage />,
      },
      {
        path: "vehicles",
        element: <VehicleManagementPage />,
      },
      {
        path: "vehicles/:vehicleId",
        element: <VehicleDetailsPage />,
      },
      {
        path: "pricing-rules",
        element: <PricingRuleManagementPage />,
      },
      {
        path: "pricing-rules/:pricingRuleId",
        element: <PricingRuleDetailsPage />,
      },
      {
        path: "invoices",
        element: <InvoiceManagementPage />,
      },
      {
        path: "invoices/:invoiceId",
        element: <InvoiceDetailsPage />,
      },
      {
        path: "payments",
        element: <PaymentManagementPage />,
      },
      {
        path: "payments/:paymentId",
        element: <PaymentDetailsPage />,
      },
      {
        path: "receivables",
        element: <ReceivablesManagementPage />,
      },
      {
        path: "roles",
        element: <RoleManagementPage />,
      },
      {
        path: "audit-logs",
        element: <AuditLogsPage />,
      },
    ],
  },
  {
    path: "/portal/driver",
    element: (
      <ProtectedRoute
        allowedRoles={["ROLE_DRIVER"]}
        authorize={(session) =>
          isDriverPortalUser(session) && Boolean(session?.identity.tenantId)
        }
      >
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DriverPortalDashboardPage />,
      },
      {
        path: "profile",
        element: <DriverPortalProfilePage />,
      },
      {
        path: "compliance",
        element: <DriverPortalCompliancePage />,
      },
      {
        path: "rides",
        element: <DriverPortalRidesPage />,
      },
      {
        path: "rides/:rideId",
        element: <DriverPortalRideDetailsPage />,
      },
      {
        path: "routes",
        element: <DriverPortalRoutesPage />,
      },
      {
        path: "routes/:routeId",
        element: <DriverPortalRouteDetailsPage />,
      },
      {
        path: "notifications",
        element: <NotificationCenterPage />,
      },
    ],
  },
  {
    path: "/portal/rider",
    element: (
      <ProtectedRoute
        allowedRoles={["ROLE_RIDER", "ROLE_GUARDIAN"]}
        authorize={(session) =>
          (isRiderPortalUser(session) || isGuardianPortalUser(session)) &&
          Boolean(session?.identity.tenantId)
        }
      >
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RiderGuardianPortalHomePage />,
      },
      {
        path: "profile",
        element: <RiderGuardianPortalProfilePage />,
      },
      {
        path: "rides",
        element: <RiderGuardianPortalRidesPage />,
      },
      {
        path: "billing",
        element: <RiderGuardianPortalBillingPage />,
      },
      {
        path: "notifications",
        element: <NotificationCenterPage />,
      },
    ],
  },
  {
    path: "/portal/organization",
    element: (
      <ProtectedRoute
        allowedRoles={["ROLE_ORGANIZATION_USER"]}
        authorize={(session) =>
          isOrganizationPortalUser(session) &&
          Boolean(session?.identity.tenantId)
        }
      >
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <OrganizationPortalHomePage />,
      },
      {
        path: "profile",
        element: <OrganizationPortalProfilePage />,
      },
      {
        path: "roster",
        element: <OrganizationPortalRosterPage />,
      },
      {
        path: "contracts",
        element: <OrganizationPortalContractsPage />,
      },
      {
        path: "billing",
        element: <OrganizationPortalBillingPage />,
      },
      {
        path: "notifications",
        element: <NotificationCenterPage />,
      },
    ],
  },
  {
    path: "/",
    element: <HomeRedirect />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
