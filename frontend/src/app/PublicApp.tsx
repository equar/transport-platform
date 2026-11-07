import { PublicProviders } from "./providers/PublicProviders";
import { PublicRouter } from "./router/PublicRouter";
import { AppErrorBoundary } from "../shared/components/AppErrorBoundary";
export function App() { return <PublicProviders><AppErrorBoundary><PublicRouter /></AppErrorBoundary></PublicProviders>; }
