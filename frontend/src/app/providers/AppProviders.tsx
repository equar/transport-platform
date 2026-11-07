import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider, useAuth } from "../../features/auth/context/AuthContext";
import {
  RuntimeCapabilitiesProvider,
  useRuntimeCapabilities,
} from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { ToastProvider } from "../../shared/providers/ToastProvider";
import { createAppTheme } from "../../shared/theme/theme";

export function ThemedProviders({ children }: PropsWithChildren) {
  const { branding } = useRuntimeCapabilities();
  const theme = createAppTheme(branding);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function AuthenticatedRuntime({ children }: PropsWithChildren) {
  const { session } = useAuth();
  return <RuntimeCapabilitiesProvider key={JSON.stringify([session?.identity.tenantId, session?.identity.id, session?.identity.roles.slice().sort()])} session={session}><ThemedProviders>{children}</ThemedProviders></RuntimeCapabilitiesProvider>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <AuthenticatedRuntime>{children}</AuthenticatedRuntime>
    </AuthProvider>
  );
}
