package com.transportplatform.tms.features.runtime.api.response;

import java.util.List;

public record RuntimeTenantCapabilitiesResponse(
        RuntimeTenantProfileResponse tenantProfile,
        RuntimeBrandingResponse branding,
        RuntimeSubscriptionPlanSummaryResponse subscriptionPlan,
        RuntimeTenantSubscriptionSummaryResponse tenantSubscription,
        List<RuntimeFeatureFlagResponse> enabledFeatureFlags,
        RuntimeOperationalSettingsResponse operationalSettings,
        RuntimeModuleAccessResponse moduleAccess) {
}