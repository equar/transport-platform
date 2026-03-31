import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type SubscriptionPlanStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "RETIRED";
export type SubscriptionPlanTier = "STARTER" | "GROWTH" | "ENTERPRISE" | "CUSTOM";
export type TenantSubscriptionStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED" | "TRIAL";
export type FeatureFlagStatus = "ACTIVE" | "INACTIVE";

export interface SubscriptionPlanRecord {
  id: number;
  planCode: string;
  name: string;
  description?: string | null;
  tier: SubscriptionPlanTier;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxUsers: number;
  maxDrivers: number;
  maxVehicles: number;
  maxRiders: number;
  maxOrganizations: number;
  includedFeatureCodes: string[];
  notes?: string | null;
  status: SubscriptionPlanStatus;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface SubscriptionPlanPayload {
  planCode?: string | null;
  name: string;
  description?: string | null;
  tier: SubscriptionPlanTier;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxUsers: number;
  maxDrivers: number;
  maxVehicles: number;
  maxRiders: number;
  maxOrganizations: number;
  includedFeatureCodes?: string[];
  notes?: string | null;
}

export interface TenantSubscriptionRecord {
  id: number;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  subscriptionPlanId: number;
  planCode: string;
  planName: string;
  planTier: SubscriptionPlanTier;
  status: TenantSubscriptionStatus;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  renewalDate: string | null;
  trial: boolean;
  trialEndDate: string | null;
  notes?: string | null;
  updatedAt?: string | null;
}

export interface TenantSubscriptionPayload {
  tenantId: string;
  subscriptionPlanId: number;
  effectiveStartDate: string;
  effectiveEndDate?: string | null;
  renewalDate?: string | null;
  isTrial: boolean;
  trialEndDate?: string | null;
  notes?: string | null;
  status: TenantSubscriptionStatus;
}

export interface FeatureFlagRecord {
  id: number;
  flagCode: string;
  name: string;
  description?: string | null;
  moduleKey: string;
  enabledByDefault: boolean;
  platformManagedOnly: boolean;
  notes?: string | null;
  status: FeatureFlagStatus;
  overrideCount: number;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface FeatureFlagPayload {
  flagCode?: string | null;
  name: string;
  description?: string | null;
  moduleKey: string;
  enabledByDefault: boolean;
  platformManagedOnly: boolean;
  notes?: string | null;
}

export interface TenantFeatureOverridePayload {
  tenantId: string;
  enabled: boolean;
  notes?: string | null;
}

export const saasAdminApi = {
  async searchSubscriptionPlans(params: { keyword: string; status: string; tier: string; page: number; size: number }) {
    const response = await apiClient.get("/platform/subscription-plans", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        tier: params.tier || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<SubscriptionPlanRecord>>(response.data);
  },
  async createSubscriptionPlan(payload: SubscriptionPlanPayload) {
    const response = await apiClient.post("/platform/subscription-plans", payload);
    return unwrapResponse<SubscriptionPlanRecord>(response.data);
  },
  async updateSubscriptionPlan(subscriptionPlanId: number, payload: SubscriptionPlanPayload) {
    const response = await apiClient.put(`/platform/subscription-plans/${subscriptionPlanId}`, payload);
    return unwrapResponse<SubscriptionPlanRecord>(response.data);
  },
  async activateSubscriptionPlan(subscriptionPlanId: number) {
    const response = await apiClient.post(`/platform/subscription-plans/${subscriptionPlanId}/activate`);
    return unwrapResponse<SubscriptionPlanRecord>(response.data);
  },
  async deactivateSubscriptionPlan(subscriptionPlanId: number) {
    const response = await apiClient.post(`/platform/subscription-plans/${subscriptionPlanId}/deactivate`);
    return unwrapResponse<SubscriptionPlanRecord>(response.data);
  },
  async retireSubscriptionPlan(subscriptionPlanId: number) {
    const response = await apiClient.post(`/platform/subscription-plans/${subscriptionPlanId}/retire`);
    return unwrapResponse<SubscriptionPlanRecord>(response.data);
  },
  async searchTenantSubscriptions(params: {
    keyword: string;
    status: string;
    planTier: string;
    trial: string;
    page: number;
    size: number;
  }) {
    const response = await apiClient.get("/platform/tenant-subscriptions", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        planTier: params.planTier || undefined,
        trial: params.trial === "" ? undefined : params.trial === "true",
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<TenantSubscriptionRecord>>(response.data);
  },
  async createTenantSubscription(payload: TenantSubscriptionPayload) {
    const response = await apiClient.post("/platform/tenant-subscriptions", payload);
    return unwrapResponse<TenantSubscriptionRecord>(response.data);
  },
  async updateTenantSubscription(tenantSubscriptionId: number, payload: TenantSubscriptionPayload) {
    const response = await apiClient.put(`/platform/tenant-subscriptions/${tenantSubscriptionId}`, payload);
    return unwrapResponse<TenantSubscriptionRecord>(response.data);
  },
  async activateTenantSubscription(tenantSubscriptionId: number) {
    const response = await apiClient.post(`/platform/tenant-subscriptions/${tenantSubscriptionId}/activate`);
    return unwrapResponse<TenantSubscriptionRecord>(response.data);
  },
  async suspendTenantSubscription(tenantSubscriptionId: number) {
    const response = await apiClient.post(`/platform/tenant-subscriptions/${tenantSubscriptionId}/suspend`);
    return unwrapResponse<TenantSubscriptionRecord>(response.data);
  },
  async cancelTenantSubscription(tenantSubscriptionId: number) {
    const response = await apiClient.post(`/platform/tenant-subscriptions/${tenantSubscriptionId}/cancel`);
    return unwrapResponse<TenantSubscriptionRecord>(response.data);
  },
  async searchFeatureFlags(params: { keyword: string; status: string; moduleKey: string; page: number; size: number }) {
    const response = await apiClient.get("/platform/feature-flags", {
      params: {
        keyword: params.keyword,
        status: params.status || undefined,
        moduleKey: params.moduleKey || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<FeatureFlagRecord>>(response.data);
  },
  async createFeatureFlag(payload: FeatureFlagPayload) {
    const response = await apiClient.post("/platform/feature-flags", payload);
    return unwrapResponse<FeatureFlagRecord>(response.data);
  },
  async updateFeatureFlag(featureFlagId: number, payload: FeatureFlagPayload) {
    const response = await apiClient.put(`/platform/feature-flags/${featureFlagId}`, payload);
    return unwrapResponse<FeatureFlagRecord>(response.data);
  },
  async activateFeatureFlag(featureFlagId: number) {
    const response = await apiClient.post(`/platform/feature-flags/${featureFlagId}/activate`);
    return unwrapResponse<FeatureFlagRecord>(response.data);
  },
  async deactivateFeatureFlag(featureFlagId: number) {
    const response = await apiClient.post(`/platform/feature-flags/${featureFlagId}/deactivate`);
    return unwrapResponse<FeatureFlagRecord>(response.data);
  },
  async upsertTenantFeatureOverride(featureFlagId: number, payload: TenantFeatureOverridePayload) {
    const response = await apiClient.put(`/platform/feature-flags/${featureFlagId}/tenant-overrides`, payload);
    return unwrapResponse(response.data);
  },
};