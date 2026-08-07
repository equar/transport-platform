import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { isPlatformAdmin } from "../../auth/access";
import { useAuth } from "../../auth/context/AuthContext";
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
  primaryColor: "#0B5FFF",
  secondaryColor: "#16324F",
  accentColor: "#14B8A6",
  supportEmail: "support@transportplatform.com",
  supportPhone: null,
  website: null,
  customLoginWelcomeText:
    "Transportation operations, workspace governance, and secure access in one platform.",
  customFooterText: "Bakaroo Transports transportation operations",
};

export function RuntimeCapabilitiesProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, session } = useAuth();
  const [capabilities, setCapabilities] =
    useState<RuntimeTenantCapabilities | null>(null);
  const [branding, setBranding] = useState<RuntimeBranding | null>(
    defaultBranding,
  );
  const [isLoading, setIsLoading] = useState(false);

  async function loadCapabilities() {
    if (!isAuthenticated || !session || isPlatformAdmin(session)) {
      setCapabilities(null);
      setBranding(defaultBranding);
      return;
    }

    setIsLoading(true);
    try {
      const nextCapabilities = await runtimeApi.getTenantCapabilities();
      setCapabilities(nextCapabilities);
      setBranding(nextCapabilities.branding ?? defaultBranding);
    } catch {
      setCapabilities(null);
      setBranding(defaultBranding);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCapabilities();
  }, [isAuthenticated, session?.accessToken, session?.identity.tenantId]);

  useEffect(() => {
    const effectiveBranding = branding ?? defaultBranding;
    document.title = effectiveBranding.displayName || "Transport Platform";

    if (!effectiveBranding.faviconUrl) {
      return;
    }

    let favicon = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = effectiveBranding.faviconUrl;
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
