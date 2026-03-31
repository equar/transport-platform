import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "../../features/auth/context/AuthContext";
import { ToastProvider } from "../../shared/providers/ToastProvider";
import { appTheme } from "../../shared/theme/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
