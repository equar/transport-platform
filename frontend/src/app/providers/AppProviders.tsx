import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider, useAuth } from "../../features/auth/context/AuthContext";
import {
  RuntimeCapabilitiesProvider,
  useRuntimeCapabilities,
} from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { ToastProvider } from "../../shared/providers/ToastProvider";
import { createAppTheme } from "../../shared/theme/theme";
import {
  AppearancePreferenceProvider,
  useAppearancePreference,
} from "../../shared/theme/AppearancePreferenceContext";

function ThemedProviders({ children }: PropsWithChildren) {
  const { branding } = useRuntimeCapabilities();
  const { mode } = useAppearancePreference();
  const theme = createAppTheme(branding, "admin", mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function AuthenticatedRuntime({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const appearanceStorageKey = `transport-platform.appearance.${session?.identity.tenantId ?? "platform"}.${session?.identity.id ?? "anonymous"}`;
  return (
    <RuntimeCapabilitiesProvider
      key={JSON.stringify([
        session?.identity.tenantId,
        session?.identity.id,
        session?.identity.roles.slice().sort(),
      ])}
      session={session}
    >
      <AppearancePreferenceProvider storageKey={appearanceStorageKey}>
        <ThemedProviders>{children}</ThemedProviders>
      </AppearancePreferenceProvider>
    </RuntimeCapabilitiesProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <AuthenticatedRuntime>{children}</AuthenticatedRuntime>
    </AuthProvider>
  );
}
