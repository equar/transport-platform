import { apiClient, unwrapResponse } from "../../../shared/api/client";

export interface RuntimeBranding {
  displayName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  website: string | null;
  customLoginWelcomeText: string | null;
  customFooterText: string | null;
}

export interface RuntimeSubscriptionPlanSummary {
  id: number;
  planCode: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxUsers: number;
  maxDrivers: number;
  maxVehicles: number;
  maxRiders: number;
  maxOrganizations: number;
  includedFeatureCodes: string[];
  status: string;
}

export interface RuntimeTenantSubscriptionSummary {
  id: number;
  status: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  renewalDate: string | null;
  trial: boolean;
  trialEndDate: string | null;
  notes: string | null;
}

export interface RuntimeFeatureFlag {
  id: number;
  flagCode: string;
  name: string;
  moduleKey: string;
  enabled: boolean;
  tenantOverrideApplied: boolean;
  overrideNotes: string | null;
}

export interface RuntimeModuleAccess {
  billing: boolean;
  notifications: boolean;
  compliance: boolean;
  incidents: boolean;
  reports: boolean;
  dispatch: boolean;
  routes: boolean;
  recurringRides: boolean;
  driverPortal: boolean;
  riderGuardianPortal: boolean;
  organizationPortal: boolean;
}

export interface RuntimeTenantCapabilities {
  tenantProfile: {
    tenantId: string;
    tenantCode: string;
    companyName: string;
    legalName: string;
    tenantStatus: string;
  };
  branding: RuntimeBranding;
  subscriptionPlan: RuntimeSubscriptionPlanSummary | null;
  tenantSubscription: RuntimeTenantSubscriptionSummary | null;
  enabledFeatureFlags: RuntimeFeatureFlag[];
  operationalSettings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    defaultRideLeadTimeMinutes: number;
    defaultInvoiceDueDays: number;
    invoicePrefix: string;
    paymentPrefix: string;
    pricingRulePrefix: string;
  };
  moduleAccess: RuntimeModuleAccess;
}

export const runtimeApi = {
  async getTenantCapabilities() {
    const response = await apiClient.get("/runtime/tenant-capabilities");
    return unwrapResponse<RuntimeTenantCapabilities>(response.data);
  },
  async getTenantBranding(tenantId: string) {
    const response = await apiClient.get("/runtime/tenant-branding", {
      params: { tenantId },
    });
    return unwrapResponse<RuntimeBranding>(response.data);
  },
};