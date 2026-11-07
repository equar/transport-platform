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
          "radial-gradient(circle at top left, rgba(18, 102, 214, 0.14), transparent 28%), radial-gradient(circle at right, rgba(77, 148, 238, 0.12), transparent 30%), linear-gradient(180deg, #f6f8fc 0%, #edf3fb 46%, #f6f8fc 100%)",
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
