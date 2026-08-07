import React, { type PropsWithChildren } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  public constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            p: 3,
          }}
        >
          <Box sx={{ maxWidth: 680, width: "100%", p: { xs: 3, md: 5 }, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, boxShadow: 3 }}>
            <Stack spacing={2.5}>
              <Chip icon={<SupportAgentRoundedIcon />} label="Application recovery" color="error" sx={{ alignSelf: "flex-start" }} />
              <Typography variant="h3">This workspace needs a quick reset.</Typography>
              <Typography color="text.secondary">An unexpected interface error interrupted this view. Your saved business data was not changed. Reload the application, and contact support if the same action fails again.</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => window.location.reload()}
                >
                  Reload application
                </Button>
                <Button variant="outlined" href="mailto:support@transportplatform.com">Contact support</Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
