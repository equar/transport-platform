import { Suspense } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { AuthMarketingPanel } from "../../features/auth/components/AuthMarketingPanel";
import { LoadingState } from "../../shared/components/LoadingState";

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(18, 102, 214, 0.16), transparent 30%), radial-gradient(circle at right, rgba(77, 148, 238, 0.12), transparent 28%), linear-gradient(180deg, #f6f8fc 0%, #edf3fb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          display: "grid",
          gap: 4,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
          },
          alignItems: "center",
        }}
      >
        <AuthMarketingPanel />

        <Suspense
          fallback={
            <LoadingState
              title="Loading access flow"
              description="Please wait while the next account screen is prepared."
              minHeight={320}
            />
          }
        >
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
