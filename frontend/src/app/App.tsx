import { Fragment } from "react";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router/AppRouter";
import { AppErrorBoundary } from "../shared/components/AppErrorBoundary";
import { useAuth } from "../features/auth/context/AuthContext";
function SessionContent() {
  const { session } = useAuth();
  const owner = JSON.stringify([session?.identity.tenantId, session?.identity.id, session?.identity.roles.slice().sort(), session?.identity.mustChangePassword]);
  return <Fragment key={owner}><AppErrorBoundary><AppRouter /></AppErrorBoundary></Fragment>;
}
export function App() { return <AppProviders><SessionContent /></AppProviders>; }
