import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "../../features/auth/context/AuthContext";
import {
  RuntimeCapabilitiesProvider,
  useRuntimeCapabilities,
} from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { ToastProvider } from "../../shared/providers/ToastProvider";
import { createAppTheme } from "../../shared/theme/theme";

function ThemedProviders({ children }: PropsWithChildren) {
  const { branding } = useRuntimeCapabilities();
  const theme = createAppTheme(branding);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <RuntimeCapabilitiesProvider>
        <ThemedProviders>{children}</ThemedProviders>
      </RuntimeCapabilitiesProvider>
    </AuthProvider>
  );
}
