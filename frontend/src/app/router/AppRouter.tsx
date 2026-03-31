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
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
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
      <ProtectedRoute allowedRoles={["ROLE_PLATFORM_ADMIN"]}>
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
      <ProtectedRoute allowedRoles={["ROLE_TENANT_ADMIN"]}>
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
