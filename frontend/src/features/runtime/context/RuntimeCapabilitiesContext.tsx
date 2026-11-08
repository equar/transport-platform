import { normalizeBusinessError } from "../../../shared/api/businessError";
import { setServiceTimezone } from "../../../shared/utils/serviceTime";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type PropsWithChildren,
} from "react";
import { isPlatformAdmin } from "../../auth/access";
import type { AuthSession } from "../../auth/types";
import {
  runtimeApi,
  type RuntimeBranding,
  type RuntimeModuleAccess,
  type RuntimeTenantCapabilities,
} from "../api/runtimeApi";

interface RuntimeCapabilitiesContextValue {
  capabilities: RuntimeTenantCapabilities | null;
  branding: RuntimeBranding | null;
  moduleAccess: RuntimeModuleAccess | null;
  isLoading: boolean;
  reloadCapabilities: () => Promise<void>;
}

const RuntimeCapabilitiesContext = createContext<
  RuntimeCapabilitiesContextValue | undefined
>(undefined);

const defaultBranding: RuntimeBranding = {
  displayName: "Bakaroo Transports",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#214e82",
  secondaryColor: "#12263e",
  accentColor: "#d8662a",
  supportEmail: "support@bakaroo.com",
  supportPhone: null,
  website: null,
  customLoginWelcomeText:
    "Transportation operations, workspace governance, and secure access in one platform.",
  customFooterText: "Bakaroo Transports transportation operations",
};

export function RuntimeCapabilitiesProvider({ children, session = null }: PropsWithChildren<{ session?: AuthSession | null }>) {
  const isAuthenticated = Boolean(session);
  const [capabilities, setCapabilities] =
    useState<RuntimeTenantCapabilities | null>(null);
  const [branding, setBranding] = useState<RuntimeBranding | null>(
    defaultBranding,
  );
  const [isLoading, setIsLoading] = useState(Boolean(session && !isPlatformAdmin(session)));
  const requestVersion = useRef(0);

  async function loadCapabilities(silent = false) {
    const version = ++requestVersion.current;
    if (!isAuthenticated || !session || isPlatformAdmin(session)) {
      setServiceTimezone(null);
      setCapabilities(null);
      setBranding(defaultBranding);
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    try {
      const nextCapabilities = await runtimeApi.getTenantCapabilities();
      if (version !== requestVersion.current) return;
      setServiceTimezone(nextCapabilities.operationalSettings.timezone);
      setCapabilities(nextCapabilities);
      setBranding(nextCapabilities.branding ?? defaultBranding);
    } catch (error) {
      if (version !== requestVersion.current) return;
      if (silent && normalizeBusinessError(error, "Tenant settings could not be refreshed.").retryable) return;
      setServiceTimezone(null);
      setCapabilities(null);
      setBranding(defaultBranding);
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    setServiceTimezone(null);
    void loadCapabilities();
    return () => { requestVersion.current++; };
  }, [isAuthenticated, session?.accessToken, session?.identity.tenantId]);

  useEffect(() => {
    if (!session?.identity.tenantId || isPlatformAdmin(session)) return;
    const refresh = () => { if (document.visibilityState === "visible") void loadCapabilities(true); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [session?.identity.tenantId, session?.identity.id, session?.accessToken]);

  useEffect(() => {
    const effectiveBranding = branding ?? defaultBranding;
    document.title = (effectiveBranding.displayName || "Transport Platform") + (import.meta.env.VITE_SITE_KIND === "admin" ? " | Admin" : "");

    let favicon = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = effectiveBranding.faviconUrl || "/branding/bakaroo-app-icon.png";
  }, [branding]);

  return (
    <RuntimeCapabilitiesContext.Provider
      value={{
        capabilities,
        branding,
        moduleAccess: capabilities?.moduleAccess ?? null,
        isLoading,
        reloadCapabilities: loadCapabilities,
      }}
    >
      {children}
    </RuntimeCapabilitiesContext.Provider>
  );
}

export function useRuntimeCapabilities() {
  const context = useContext(RuntimeCapabilitiesContext);

  if (!context) {
    throw new Error(
      "useRuntimeCapabilities must be used within RuntimeCapabilitiesProvider.",
    );
  }

  return context;
}
