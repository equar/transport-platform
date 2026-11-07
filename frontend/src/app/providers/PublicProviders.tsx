import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { RuntimeCapabilitiesProvider } from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { ToastProvider } from "../../shared/providers/ToastProvider";
import { createAppTheme } from "../../shared/theme/theme";
const theme = createAppTheme(undefined, 'public');
export function PublicProviders({ children }: PropsWithChildren) {
  return <RuntimeCapabilitiesProvider><ThemeProvider theme={theme}><CssBaseline /><ToastProvider>{children}</ToastProvider></ThemeProvider></RuntimeCapabilitiesProvider>;
}
