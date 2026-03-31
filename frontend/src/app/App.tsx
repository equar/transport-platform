import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router/AppRouter";
import { AppErrorBoundary } from "../shared/components/AppErrorBoundary";

export function App() {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <AppRouter />
      </AppErrorBoundary>
    </AppProviders>
  );
}
