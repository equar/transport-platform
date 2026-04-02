import { Suspense } from "react";
import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { PublicFooter } from "../../features/public/components/PublicFooter";
import { PublicHeader } from "../../features/public/components/PublicHeader";
import { LoadingState } from "../../shared/components/LoadingState";

export function PublicLayout() {
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
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Suspense
            fallback={
              <LoadingState
                title="Loading page"
                description="Please wait while the latest public content is prepared."
                minHeight={320}
              />
            }
          >
            <Outlet />
          </Suspense>
        </Container>
      </Box>
      <PublicFooter />
    </Box>
  );
}
