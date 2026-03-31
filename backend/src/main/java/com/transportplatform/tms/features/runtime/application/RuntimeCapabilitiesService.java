package com.transportplatform.tms.features.runtime.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.runtime.api.response.RuntimeBrandingResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeFeatureFlagResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeModuleAccessResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeOperationalSettingsResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeSubscriptionPlanSummaryResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeTenantCapabilitiesResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeTenantProfileResponse;
import com.transportplatform.tms.features.runtime.api.response.RuntimeTenantSubscriptionSummaryResponse;
import com.transportplatform.tms.features.saas.application.TenantFeatureResolutionService;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionRepository;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RuntimeCapabilitiesService {

    private static final Map<String, Boolean> MODULE_DEFAULTS = Map.ofEntries(
            Map.entry("BILLING", true),
            Map.entry("NOTIFICATIONS", true),
            Map.entry("COMPLIANCE", true),
            Map.entry("INCIDENTS", true),
            Map.entry("REPORTS", true),
            Map.entry("DISPATCH", true),
            Map.entry("ROUTES", true),
            Map.entry("RECURRING_RIDES", true),
            Map.entry("PORTAL_DRIVER", true),
            Map.entry("PORTAL_RIDER_GUARDIAN", true),
            Map.entry("PORTAL_ORGANIZATION", true));

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final TenantRepository tenantRepository;
    private final TenantSettingsRepository tenantSettingsRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final TenantFeatureResolutionService tenantFeatureResolutionService;

    public RuntimeCapabilitiesService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            TenantRepository tenantRepository,
            TenantSettingsRepository tenantSettingsRepository,
            TenantSubscriptionRepository tenantSubscriptionRepository,
            TenantFeatureResolutionService tenantFeatureResolutionService) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.tenantRepository = tenantRepository;
        this.tenantSettingsRepository = tenantSettingsRepository;
        this.tenantSubscriptionRepository = tenantSubscriptionRepository;
        this.tenantFeatureResolutionService = tenantFeatureResolutionService;
    }

    @Transactional(readOnly = true)
    public RuntimeTenantCapabilitiesResponse getCurrentTenantCapabilities() {
        var user = currentAuthenticatedUserService.requireCurrentUser();
        if (user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "A tenant-scoped user is required for tenant capabilities.");
        }
        Tenant tenant = requireTenant(user.tenantId());
        TenantSettings settings = tenantSettingsRepository.findById(tenant.getId())
                .orElseGet(() -> defaultSettings(tenant.getId()));
        var currentSubscription = tenantSubscriptionRepository
                .findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(
                        tenant.getId(),
                        Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL,
                                TenantSubscriptionStatus.SUSPENDED))
                .orElse(null);
        var resolvedFlags = tenantFeatureResolutionService.resolveForTenant(tenant.getId());

        return new RuntimeTenantCapabilitiesResponse(
                new RuntimeTenantProfileResponse(
                        tenant.getId(),
                        tenant.getTenantCode(),
                        tenant.getCompanyName(),
                        tenant.getLegalName(),
                        tenant.getStatus().name()),
                toBranding(tenant, settings),
                currentSubscription == null ? null
                        : new RuntimeSubscriptionPlanSummaryResponse(
                                currentSubscription.getSubscriptionPlan().getId(),
                                currentSubscription.getSubscriptionPlan().getPlanCode(),
                                currentSubscription.getSubscriptionPlan().getName(),
                                currentSubscription.getSubscriptionPlan().getTier(),
                                currentSubscription.getSubscriptionPlan().getMonthlyPrice(),
                                currentSubscription.getSubscriptionPlan().getAnnualPrice(),
                                currentSubscription.getSubscriptionPlan().getCurrency(),
                                currentSubscription.getSubscriptionPlan().getMaxUsers(),
                                currentSubscription.getSubscriptionPlan().getMaxDrivers(),
                                currentSubscription.getSubscriptionPlan().getMaxVehicles(),
                                currentSubscription.getSubscriptionPlan().getMaxRiders(),
                                currentSubscription.getSubscriptionPlan().getMaxOrganizations(),
                                currentSubscription.getSubscriptionPlan().getIncludedFeatureCodes(),
                                currentSubscription.getSubscriptionPlan().getStatus().name()),
                currentSubscription == null ? null
                        : new RuntimeTenantSubscriptionSummaryResponse(
                                currentSubscription.getId(),
                                currentSubscription.getStatus().name(),
                                currentSubscription.getEffectiveStartDate(),
                                currentSubscription.getEffectiveEndDate(),
                                currentSubscription.getRenewalDate(),
                                currentSubscription.isTrial(),
                                currentSubscription.getTrialEndDate(),
                                currentSubscription.getNotes()),
                resolvedFlags.stream()
                        .filter(TenantFeatureResolutionService.ResolvedFeatureFlag::enabled)
                        .map(flag -> new RuntimeFeatureFlagResponse(
                                flag.id(),
                                flag.flagCode(),
                                flag.name(),
                                flag.moduleKey(),
                                flag.enabled(),
                                flag.tenantOverrideApplied(),
                                flag.overrideNotes()))
                        .toList(),
                new RuntimeOperationalSettingsResponse(
                        settings.getTimezone(),
                        settings.getCurrency(),
                        settings.getDateFormat(),
                        settings.getDefaultRideLeadTimeMinutes(),
                        settings.getDefaultInvoiceDueDays(),
                        settings.getInvoicePrefix(),
                        settings.getPaymentPrefix(),
                        settings.getPricingRulePrefix()),
                resolveModuleAccess(resolvedFlags));
    }

    @Transactional(readOnly = true)
    public RuntimeBrandingResponse getTenantBranding(String tenantId) {
        if (tenantId == null || tenantId.isBlank() || "platform".equalsIgnoreCase(tenantId)) {
            return new RuntimeBrandingResponse(
                    "Transport Platform",
                    null,
                    null,
                    "#0B5FFF",
                    "#16324F",
                    "#14B8A6",
                    "support@transportplatform.com",
                    null,
                    null,
                    "Sign in with your company tenant ID or the platform workspace.",
                    "Transport Platform SaaS operations");
        }
        Tenant tenant = requireTenant(tenantId);
        TenantSettings settings = tenantSettingsRepository.findById(tenantId)
                .orElseGet(() -> defaultSettings(tenantId));
        return toBranding(tenant, settings);
    }

    private RuntimeModuleAccessResponse resolveModuleAccess(
            List<TenantFeatureResolutionService.ResolvedFeatureFlag> flags) {
        Map<String, Boolean> resolved = new java.util.LinkedHashMap<>(MODULE_DEFAULTS);
        flags.forEach(flag -> {
            resolved.put(flag.flagCode(), flag.enabled());
            resolved.put(flag.moduleKey(), flag.enabled());
        });
        return new RuntimeModuleAccessResponse(
                resolved.getOrDefault("BILLING", true),
                resolved.getOrDefault("NOTIFICATIONS", true),
                resolved.getOrDefault("COMPLIANCE", true),
                resolved.getOrDefault("INCIDENTS", true),
                resolved.getOrDefault("REPORTS", true),
                resolved.getOrDefault("DISPATCH", true),
                resolved.getOrDefault("ROUTES", true),
                resolved.getOrDefault("RECURRING_RIDES", true),
                resolved.getOrDefault("PORTAL_DRIVER", true),
                resolved.getOrDefault("PORTAL_RIDER_GUARDIAN", true),
                resolved.getOrDefault("PORTAL_ORGANIZATION", true));
    }

    private RuntimeBrandingResponse toBranding(Tenant tenant, TenantSettings settings) {
        return new RuntimeBrandingResponse(
                settings.getDisplayName() == null || settings.getDisplayName().isBlank()
                        ? tenant.getCompanyName()
                        : settings.getDisplayName(),
                settings.getCompanyLogoUrl(),
                settings.getFaviconUrl(),
                settings.getPrimaryColor(),
                settings.getSecondaryColor(),
                settings.getAccentColor(),
                tenant.getEmail(),
                tenant.getPhone(),
                settings.getWebsite(),
                settings.getCustomLoginWelcomeText(),
                settings.getCustomFooterText());
    }

    private Tenant requireTenant(String tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Tenant was not found."));
    }

    private TenantSettings defaultSettings(String tenantId) {
        TenantSettings settings = new TenantSettings();
        settings.setTenantId(tenantId);
        settings.setTimezone("UTC");
        settings.setCurrency("USD");
        settings.setDateFormat("MM/dd/yyyy");
        settings.setDefaultRideLeadTimeMinutes(120);
        settings.setDefaultInvoiceDueDays(30);
        settings.setInvoicePrefix("INV");
        settings.setPaymentPrefix("PAY");
        settings.setPricingRulePrefix("PRICE");
        return settings;
    }
}