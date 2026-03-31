import React, { type PropsWithChildren } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";

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
          <Alert severity="error" sx={{ maxWidth: 640, width: "100%" }}>
            <Stack spacing={2}>
              <Typography variant="h6">Something went wrong.</Typography>
              <Typography variant="body2">
                The app hit an unexpected error. Refresh the page to continue.
                If the problem persists, contact support.
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                >
                  Reload application
                </Button>
              </Box>
            </Stack>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
