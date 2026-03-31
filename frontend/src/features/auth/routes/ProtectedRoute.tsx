import type { PropsWithChildren } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthSession } from "../types";

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
  const location = useLocation();

  if (isLoading) {
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
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  if (authorize && !authorize(session)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
