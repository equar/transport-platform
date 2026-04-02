import { lazy, type ComponentType } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { AuthLayout } from "../layouts/AuthLayout";
import { PublicAuthLayout } from "../layouts/PublicAuthLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { ProtectedRoute } from "../../features/auth/routes/ProtectedRoute";
import {
  canAccessCompanyWorkspace,
  isDriverPortalUser,
  isGuardianPortalUser,
  isOrganizationPortalUser,
  isPlatformAdmin,
  isRiderPortalUser,
} from "../../features/auth/access";
import { DriverPortalLayout } from "../../features/driver-portal/components/DriverPortalLayout";
import { RiderGuardianPortalLayout } from "../../features/rider-guardian-portal/components/RiderGuardianPortalLayout";
import { OrganizationPortalLayout } from "../../features/organization-portal/components/OrganizationPortalLayout";

function lazyPage<TModule extends Record<string, unknown>>(
  importer: () => Promise<TModule>,
  exportName: keyof TModule,
) {
  return lazy(async () => {
    const module = await importer();
    return {
      default: module[exportName] as ComponentType<any>,
    };
  });
}

const NotFoundPage = lazyPage(
  () => import("../pages/NotFoundPage"),
  "NotFoundPage",
);
const UnauthorizedPage = lazyPage(
  () => import("../pages/UnauthorizedPage"),
  "UnauthorizedPage",
);
const AuditLogsPage = lazyPage(
  () => import("../../features/audit/pages/AuditLogsPage"),
  "AuditLogsPage",
);
const LoginPage = lazyPage(
  () => import("../../features/auth/pages/LoginPage"),
  "LoginPage",
);
const DashboardPage = lazyPage(
  () => import("../../features/dashboard/pages/DashboardPage"),
  "DashboardPage",
);
const InvoiceDetailsPage = lazyPage(
  () => import("../../features/billing/pages/InvoiceDetailsPage"),
  "InvoiceDetailsPage",
);
const InvoiceManagementPage = lazyPage(
  () => import("../../features/billing/pages/InvoiceManagementPage"),
  "InvoiceManagementPage",
);
const PaymentDetailsPage = lazyPage(
  () => import("../../features/billing/pages/PaymentDetailsPage"),
  "PaymentDetailsPage",
);
const PaymentManagementPage = lazyPage(
  () => import("../../features/billing/pages/PaymentManagementPage"),
  "PaymentManagementPage",
);
const PricingRuleDetailsPage = lazyPage(
  () => import("../../features/billing/pages/PricingRuleDetailsPage"),
  "PricingRuleDetailsPage",
);
const PricingRuleManagementPage = lazyPage(
  () => import("../../features/billing/pages/PricingRuleManagementPage"),
  "PricingRuleManagementPage",
);
const ReceivablesManagementPage = lazyPage(
  () => import("../../features/billing/pages/ReceivablesManagementPage"),
  "ReceivablesManagementPage",
);
const DispatchBoardPage = lazyPage(
  () => import("../../features/dispatch/pages/DispatchBoardPage"),
  "DispatchBoardPage",
);
const DriverDetailsPage = lazyPage(
  () => import("../../features/drivers/pages/DriverDetailsPage"),
  "DriverDetailsPage",
);
const DriverManagementPage = lazyPage(
  () => import("../../features/drivers/pages/DriverManagementPage"),
  "DriverManagementPage",
);
const GuardianDetailsPage = lazyPage(
  () => import("../../features/guardians/pages/GuardianDetailsPage"),
  "GuardianDetailsPage",
);
const GuardianManagementPage = lazyPage(
  () => import("../../features/guardians/pages/GuardianManagementPage"),
  "GuardianManagementPage",
);
const RecurringRideDetailsPage = lazyPage(
  () => import("../../features/rides/pages/RecurringRideDetailsPage"),
  "RecurringRideDetailsPage",
);
const RecurringRideManagementPage = lazyPage(
  () => import("../../features/rides/pages/RecurringRideManagementPage"),
  "RecurringRideManagementPage",
);
const RideDetailsPage = lazyPage(
  () => import("../../features/rides/pages/RideDetailsPage"),
  "RideDetailsPage",
);
const RideManagementPage = lazyPage(
  () => import("../../features/rides/pages/RideManagementPage"),
  "RideManagementPage",
);
const RiderDetailsPage = lazyPage(
  () => import("../../features/riders/pages/RiderDetailsPage"),
  "RiderDetailsPage",
);
const RiderManagementPage = lazyPage(
  () => import("../../features/riders/pages/RiderManagementPage"),
  "RiderManagementPage",
);
const VehicleDetailsPage = lazyPage(
  () => import("../../features/vehicles/pages/VehicleDetailsPage"),
  "VehicleDetailsPage",
);
const VehicleManagementPage = lazyPage(
  () => import("../../features/vehicles/pages/VehicleManagementPage"),
  "VehicleManagementPage",
);
const TenantManagementPage = lazyPage(
  () => import("../../features/tenants/pages/TenantManagementPage"),
  "TenantManagementPage",
);
const RouteDetailsPage = lazyPage(
  () => import("../../features/routes/pages/RouteDetailsPage"),
  "RouteDetailsPage",
);
const RouteManagementPage = lazyPage(
  () => import("../../features/routes/pages/RouteManagementPage"),
  "RouteManagementPage",
);
const CompanyApplicationsPage = lazyPage(
  () =>
    import("../../features/company-applications/pages/CompanyApplicationsPage"),
  "CompanyApplicationsPage",
);
const PublicCompanyApplicationPage = lazyPage(
  () =>
    import("../../features/company-applications/pages/PublicCompanyApplicationPage"),
  "PublicCompanyApplicationPage",
);
const RoleManagementPage = lazyPage(
  () => import("../../features/roles/pages/RoleManagementPage"),
  "RoleManagementPage",
);
const UserManagementPage = lazyPage(
  () => import("../../features/users/pages/UserManagementPage"),
  "UserManagementPage",
);
const NotificationCenterPage = lazyPage(
  () => import("../../features/notifications/pages/NotificationCenterPage"),
  "NotificationCenterPage",
);
const NotificationTemplateManagementPage = lazyPage(
  () =>
    import("../../features/notifications/pages/NotificationTemplateManagementPage"),
  "NotificationTemplateManagementPage",
);
const ComplianceDashboardPage = lazyPage(
  () => import("../../features/compliance/pages/ComplianceDashboardPage"),
  "ComplianceDashboardPage",
);
const IncidentManagementPage = lazyPage(
  () => import("../../features/incidents/pages/IncidentManagementPage"),
  "IncidentManagementPage",
);
const CompanyReportsPage = lazyPage(
  () => import("../../features/reports/pages/CompanyReportsPage"),
  "CompanyReportsPage",
);
const CompanySettingsPage = lazyPage(
  () => import("../../features/settings/pages/CompanySettingsPage"),
  "CompanySettingsPage",
);
const DriverPortalDashboardPage = lazyPage(
  () => import("../../features/driver-portal/pages/DriverPortalDashboardPage"),
  "DriverPortalDashboardPage",
);
const DriverPortalNotificationsPage = lazyPage(
  () =>
    import("../../features/driver-portal/pages/DriverPortalNotificationsPage"),
  "DriverPortalNotificationsPage",
);
const DriverPortalProfilePage = lazyPage(
  () => import("../../features/driver-portal/pages/DriverPortalProfilePage"),
  "DriverPortalProfilePage",
);
const DriverPortalCompliancePage = lazyPage(
  () => import("../../features/driver-portal/pages/DriverPortalCompliancePage"),
  "DriverPortalCompliancePage",
);
const DriverPortalRidesPage = lazyPage(
  () => import("../../features/driver-portal/pages/DriverPortalRidesPage"),
  "DriverPortalRidesPage",
);
const DriverPortalRideDetailsPage = lazyPage(
  () =>
    import("../../features/driver-portal/pages/DriverPortalRideDetailsPage"),
  "DriverPortalRideDetailsPage",
);
const DriverPortalRoutesPage = lazyPage(
  () => import("../../features/driver-portal/pages/DriverPortalRoutesPage"),
  "DriverPortalRoutesPage",
);
const DriverPortalRouteDetailsPage = lazyPage(
  () =>
    import("../../features/driver-portal/pages/DriverPortalRouteDetailsPage"),
  "DriverPortalRouteDetailsPage",
);
const RiderGuardianPortalBillingPage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalBillingPage"),
  "RiderGuardianPortalBillingPage",
);
const RiderGuardianPortalHomePage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalHomePage"),
  "RiderGuardianPortalHomePage",
);
const RiderGuardianPortalNotificationsPage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalNotificationsPage"),
  "RiderGuardianPortalNotificationsPage",
);
const RiderGuardianPortalPaymentHistoryPage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalPaymentHistoryPage"),
  "RiderGuardianPortalPaymentHistoryPage",
);
const RiderGuardianPortalProfilePage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalProfilePage"),
  "RiderGuardianPortalProfilePage",
);
const RiderGuardianPortalRideDetailsPage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalRideDetailsPage"),
  "RiderGuardianPortalRideDetailsPage",
);
const RiderGuardianPortalRideHistoryPage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalRideHistoryPage"),
  "RiderGuardianPortalRideHistoryPage",
);
const RiderGuardianPortalRidesPage = lazyPage(
  () =>
    import("../../features/rider-guardian-portal/pages/RiderGuardianPortalRidesPage"),
  "RiderGuardianPortalRidesPage",
);
const OrganizationPortalBillingPage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalBillingPage"),
  "OrganizationPortalBillingPage",
);
const OrganizationPortalContactsPage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalContactsPage"),
  "OrganizationPortalContactsPage",
);
const OrganizationPortalContractsPage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalContractsPage"),
  "OrganizationPortalContractsPage",
);
const OrganizationPortalHomePage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalHomePage"),
  "OrganizationPortalHomePage",
);
const OrganizationPortalNotificationsPage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalNotificationsPage"),
  "OrganizationPortalNotificationsPage",
);
const OrganizationPortalProfilePage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalProfilePage"),
  "OrganizationPortalProfilePage",
);
const OrganizationPortalRidesPage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalRidesPage"),
  "OrganizationPortalRidesPage",
);
const OrganizationPortalRosterPage = lazyPage(
  () =>
    import("../../features/organization-portal/pages/OrganizationPortalRosterPage"),
  "OrganizationPortalRosterPage",
);
const FeatureFlagManagementPage = lazyPage(
  () => import("../../features/saas/pages/FeatureFlagManagementPage"),
  "FeatureFlagManagementPage",
);
const SubscriptionPlanManagementPage = lazyPage(
  () => import("../../features/saas/pages/SubscriptionPlanManagementPage"),
  "SubscriptionPlanManagementPage",
);
const TenantSubscriptionManagementPage = lazyPage(
  () => import("../../features/saas/pages/TenantSubscriptionManagementPage"),
  "TenantSubscriptionManagementPage",
);
const AboutPage = lazyPage(
  () => import("../../features/public/pages/AboutPage"),
  "AboutPage",
);
const ContactPage = lazyPage(
  () => import("../../features/public/pages/ContactPage"),
  "ContactPage",
);
const DataProcessingSupportPage = lazyPage(
  () => import("../../features/public/pages/DataProcessingSupportPage"),
  "DataProcessingSupportPage",
);
const FaqPage = lazyPage(
  () => import("../../features/public/pages/FaqPage"),
  "FaqPage",
);
const FeaturesPage = lazyPage(
  () => import("../../features/public/pages/FeaturesPage"),
  "FeaturesPage",
);
const ForgotPasswordPage = lazyPage(
  () => import("../../features/public/pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const HomePage = lazyPage(
  () => import("../../features/public/pages/HomePage"),
  "HomePage",
);
const PricingPage = lazyPage(
  () => import("../../features/public/pages/PricingPage"),
  "PricingPage",
);
const PrivacyAndDataHandlingPage = lazyPage(
  () => import("../../features/public/pages/PrivacyAndDataHandlingPage"),
  "PrivacyAndDataHandlingPage",
);
const ResetPasswordPage = lazyPage(
  () => import("../../features/public/pages/ResetPasswordPage"),
  "ResetPasswordPage",
);
const SecurityOverviewPage = lazyPage(
  () => import("../../features/public/pages/SecurityOverviewPage"),
  "SecurityOverviewPage",
);
const ServiceAgreementsPage = lazyPage(
  () => import("../../features/public/pages/ServiceAgreementsPage"),
  "ServiceAgreementsPage",
);
const SolutionsPage = lazyPage(
  () => import("../../features/public/pages/SolutionsPage"),
  "SolutionsPage",
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "solutions",
        element: <SolutionsPage />,
      },
      {
        path: "features",
        element: <FeaturesPage />,
      },
      {
        path: "pricing",
        element: <PricingPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "privacy",
        element: <PrivacyAndDataHandlingPage />,
      },
      {
        path: "service-agreements",
        element: <ServiceAgreementsPage />,
      },
      {
        path: "security",
        element: <SecurityOverviewPage />,
      },
      {
        path: "data-processing-support",
        element: <DataProcessingSupportPage />,
      },
      {
        path: "faq",
        element: <FaqPage />,
      },
      {
        path: "/apply",
        element: <PublicCompanyApplicationPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    element: <PublicAuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
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
        allowedRoles={[
          "ROLE_TENANT_ADMIN",
          "ROLE_DISPATCHER",
          "ROLE_BILLING_ADMIN",
          "ROLE_COMPLIANCE_ADMIN",
        ]}
        authorize={(session) =>
          canAccessCompanyWorkspace(session) &&
          Boolean(session?.identity.tenantId)
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
        <DriverPortalLayout />
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
        element: <DriverPortalNotificationsPage />,
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
        <RiderGuardianPortalLayout />
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
        path: "rides/history",
        element: <RiderGuardianPortalRideHistoryPage />,
      },
      {
        path: "rides/:rideId",
        element: <RiderGuardianPortalRideDetailsPage />,
      },
      {
        path: "billing",
        element: <RiderGuardianPortalBillingPage />,
      },
      {
        path: "billing/payments",
        element: <RiderGuardianPortalPaymentHistoryPage />,
      },
      {
        path: "notifications",
        element: <RiderGuardianPortalNotificationsPage />,
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
        <OrganizationPortalLayout />
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
        path: "contacts",
        element: <OrganizationPortalContactsPage />,
      },
      {
        path: "roster",
        element: <OrganizationPortalRosterPage />,
      },
      {
        path: "rides",
        element: <OrganizationPortalRidesPage />,
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
        element: <OrganizationPortalNotificationsPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
