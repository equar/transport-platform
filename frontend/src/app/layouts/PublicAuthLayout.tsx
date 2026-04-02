import { Suspense } from "react";
import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { AuthMarketingPanel } from "../../features/auth/components/AuthMarketingPanel";
import { PublicFooter } from "../../features/public/components/PublicFooter";
import { PublicHeader } from "../../features/public/components/PublicHeader";
import { LoadingState } from "../../shared/components/LoadingState";

export function PublicAuthLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top left, rgba(18, 112, 112, 0.14), transparent 28%), radial-gradient(circle at right, rgba(196, 106, 34, 0.12), transparent 30%), linear-gradient(180deg, #f7f8f4 0%, #eef3f0 46%, #f7f8f4 100%)",
      }}
    >
      <PublicHeader />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="xl" sx={{ width: "100%" }}>
          <Box
            sx={{
              width: "100%",
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
        </Container>
      </Box>
      <PublicFooter />
    </Box>
  );
}
