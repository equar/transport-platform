import type { PropsWithChildren } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { canAccessShellPath } from "../../../app/layouts/appShellNavigation";
import {
  getDefaultRoute,
  isPrivateAppPath,
  resolveAccessFailureRedirect,
} from "../access";
import { useAuth } from "../context/AuthContext";
import type { AuthSession } from "../types";
import { useRuntimeCapabilities } from "../../runtime/context/RuntimeCapabilitiesContext";

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: string[];
  authorize?: (session: AuthSession | null) => boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  authorize,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, session } = useAuth();
  const { isLoading: isRuntimeLoading, moduleAccess } =
    useRuntimeCapabilities();
  const location = useLocation();

  function renderUnauthorizedRedirect() {
    const fallbackRoute = resolveAccessFailureRedirect(
      session,
      location.pathname,
    );

    if (fallbackRoute && fallbackRoute !== location.pathname) {
      return <Navigate to={fallbackRoute} replace />;
    }

    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location,
          fallbackTo: getDefaultRoute(session),
        }}
      />
    );
  }

  if (
    isLoading ||
    (isAuthenticated && isPrivateAppPath(location.pathname) && isRuntimeLoading)
  ) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.some((role) => hasRole(role))) {
    return renderUnauthorizedRedirect();
  }

  if (authorize && !authorize(session)) {
    return renderUnauthorizedRedirect();
  }

  if (
    isPrivateAppPath(location.pathname) &&
    !canAccessShellPath(session, moduleAccess, location.pathname)
  ) {
    return renderUnauthorizedRedirect();
  }

  return <>{children}</>;
}
