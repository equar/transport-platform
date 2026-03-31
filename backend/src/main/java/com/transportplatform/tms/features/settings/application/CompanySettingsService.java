package com.transportplatform.tms.features.settings.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.settings.api.request.CompanySettingsUpdateRequest;
import com.transportplatform.tms.features.settings.api.response.CompanySettingsResponse;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanySettingsService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final TenantRepository tenantRepository;
    private final TenantSettingsRepository tenantSettingsRepository;
    private final AuditLogService auditLogService;

    public CompanySettingsService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            TenantRepository tenantRepository,
            TenantSettingsRepository tenantSettingsRepository,
            AuditLogService auditLogService) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.tenantRepository = tenantRepository;
        this.tenantSettingsRepository = tenantSettingsRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public CompanySettingsResponse getCompanySettings() {
        Tenant tenant = requireCompanyTenant();
        TenantSettings settings = getOrCreateDefaults(tenant.getId());
        return toResponse(tenant, settings);
    }

    @Transactional
    public CompanySettingsResponse updateCompanySettings(CompanySettingsUpdateRequest request) {
        Tenant tenant = requireCompanyTenant();
        TenantSettings settings = getOrCreateDefaults(tenant.getId());
        Object oldSnapshot = snapshot(tenant, settings);

        tenant.setCompanyName(request.companyName().trim());
        tenant.setLegalName(request.legalName().trim());
        tenant.setBusinessType(request.businessType().trim());
        tenant.setEmail(request.supportEmail().trim().toLowerCase());
        tenant.setPhone(request.supportPhone().trim());
        tenant.setAddressLine1(request.addressLine1().trim());
        tenant.setAddressLine2(trimToNull(request.addressLine2()));
        tenant.setCity(request.city().trim());
        tenant.setState(request.state().trim());
        tenant.setZipCode(request.zipCode().trim());
        tenant.setCountry(request.country().trim());

        settings.setTenantId(tenant.getId());
        settings.setTimezone(request.timezone().trim());
        settings.setCurrency(request.currency().trim().toUpperCase());
        settings.setDateFormat(request.dateFormat().trim());
        settings.setDefaultRideLeadTimeMinutes(request.defaultRideLeadTimeMinutes());
        settings.setAllowManualRideCreation(request.allowManualRideCreation());
        settings.setAllowRoundTripRides(request.allowRoundTripRides());
        settings.setDispatchStrictComplianceMode(request.dispatchStrictComplianceMode());
        settings.setDefaultInvoiceDueDays(request.defaultInvoiceDueDays());
        settings.setDefaultNotificationPreferencesSummary(trimToNull(request.defaultNotificationPreferencesSummary()));
        settings.setRequireDriverLicense(request.requireDriverLicense());
        settings.setRequireBackgroundCheck(request.requireBackgroundCheck());
        settings.setRequireDrugTest(request.requireDrugTest());
        settings.setRequireVehicleRegistration(request.requireVehicleRegistration());
        settings.setRequireVehicleInsurance(request.requireVehicleInsurance());
        settings.setRequireVehicleInspection(request.requireVehicleInspection());
        settings.setExpiringSoonThresholdDays(request.expiringSoonThresholdDays());
        settings.setInvoicePrefix(request.invoicePrefix().trim().toUpperCase());
        settings.setPaymentPrefix(request.paymentPrefix().trim().toUpperCase());
        settings.setPricingRulePrefix(request.pricingRulePrefix().trim().toUpperCase());
        settings.setTaxEnabled(request.taxEnabled());
        settings.setDefaultTaxRate(request.defaultTaxRate().setScale(2, java.math.RoundingMode.HALF_UP));
        settings.setAllowManualInvoiceOverrides(request.allowManualInvoiceOverrides());
        settings.setCompanyLogoUrl(trimToNull(request.companyLogoUrl()));
        settings.setPrimaryColor(trimToNull(request.primaryColor()));

        tenantRepository.save(tenant);
        TenantSettings savedSettings = tenantSettingsRepository.save(settings);
        auditLogService.record(new AuditLogCommand(
                null,
                tenant.getId(),
                "SETTINGS",
                "UPDATED",
                "TENANT_SETTINGS",
                tenant.getId(),
                "Company settings were updated.",
                oldSnapshot,
                snapshot(tenant, savedSettings)));
        return toResponse(tenant, savedSettings);
    }

    @Transactional(readOnly = true)
    public int calculateProfileCompleteness(String tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Tenant was not found."));
        TenantSettings settings = getOrCreateDefaults(tenantId);
        return calculateProfileCompleteness(tenant, settings);
    }

    private Tenant requireCompanyTenant() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "A company administrator account is required for settings access.");
        }
        return tenantRepository.findById(user.tenantId())
                .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Tenant was not found."));
    }

    private TenantSettings getOrCreateDefaults(String tenantId) {
        return tenantSettingsRepository.findById(tenantId).orElseGet(() -> defaultSettings(tenantId));
    }

    private TenantSettings defaultSettings(String tenantId) {
        TenantSettings settings = new TenantSettings();
        settings.setTenantId(tenantId);
        settings.setTimezone("UTC");
        settings.setCurrency("USD");
        settings.setDateFormat("MM/dd/yyyy");
        settings.setDefaultRideLeadTimeMinutes(120);
        settings.setAllowManualRideCreation(true);
        settings.setAllowRoundTripRides(true);
        settings.setDispatchStrictComplianceMode(false);
        settings.setDefaultInvoiceDueDays(30);
        settings.setDefaultNotificationPreferencesSummary("In-app notifications enabled for operational alerts.");
        settings.setRequireDriverLicense(true);
        settings.setRequireBackgroundCheck(true);
        settings.setRequireDrugTest(true);
        settings.setRequireVehicleRegistration(true);
        settings.setRequireVehicleInsurance(true);
        settings.setRequireVehicleInspection(true);
        settings.setExpiringSoonThresholdDays(30);
        settings.setInvoicePrefix("INV");
        settings.setPaymentPrefix("PAY");
        settings.setPricingRulePrefix("PRICE");
        settings.setTaxEnabled(false);
        settings.setDefaultTaxRate(BigDecimal.ZERO.setScale(2));
        settings.setAllowManualInvoiceOverrides(false);
        settings.setCompanyLogoUrl(null);
        settings.setPrimaryColor(null);
        return settings;
    }

    private CompanySettingsResponse toResponse(Tenant tenant, TenantSettings settings) {
        return new CompanySettingsResponse(
                tenant.getId(),
                tenant.getCompanyName(),
                tenant.getLegalName(),
                tenant.getBusinessType(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getAddressLine1(),
                tenant.getAddressLine2(),
                tenant.getCity(),
                tenant.getState(),
                tenant.getZipCode(),
                tenant.getCountry(),
                settings.getTimezone(),
                settings.getCurrency(),
                settings.getDateFormat(),
                settings.getDefaultRideLeadTimeMinutes(),
                settings.isAllowManualRideCreation(),
                settings.isAllowRoundTripRides(),
                settings.isDispatchStrictComplianceMode(),
                settings.getDefaultInvoiceDueDays(),
                settings.getDefaultNotificationPreferencesSummary(),
                settings.isRequireDriverLicense(),
                settings.isRequireBackgroundCheck(),
                settings.isRequireDrugTest(),
                settings.isRequireVehicleRegistration(),
                settings.isRequireVehicleInsurance(),
                settings.isRequireVehicleInspection(),
                settings.getExpiringSoonThresholdDays(),
                settings.getInvoicePrefix(),
                settings.getPaymentPrefix(),
                settings.getPricingRulePrefix(),
                settings.isTaxEnabled(),
                settings.getDefaultTaxRate(),
                settings.isAllowManualInvoiceOverrides(),
                settings.getCompanyLogoUrl(),
                settings.getPrimaryColor(),
                calculateProfileCompleteness(tenant, settings),
                settings.getCreatedBy(),
                settings.getCreatedAt(),
                settings.getUpdatedBy(),
                settings.getUpdatedAt());
    }

    private int calculateProfileCompleteness(Tenant tenant, TenantSettings settings) {
        List<Boolean> checks = List.of(
                hasText(tenant.getCompanyName()),
                hasText(tenant.getLegalName()),
                hasText(tenant.getEmail()),
                hasText(tenant.getPhone()),
                hasText(tenant.getAddressLine1()),
                hasText(tenant.getCity()),
                hasText(tenant.getState()),
                hasText(tenant.getZipCode()),
                hasText(tenant.getCountry()),
                hasText(settings.getTimezone()),
                hasText(settings.getCurrency()),
                hasText(settings.getInvoicePrefix()),
                hasText(settings.getPaymentPrefix()),
                hasText(settings.getPricingRulePrefix()),
                hasText(settings.getDefaultNotificationPreferencesSummary()));
        long completed = checks.stream().filter(Boolean::booleanValue).count();
        return (int) Math.round((completed * 100.0) / checks.size());
    }

    private Object snapshot(Tenant tenant, TenantSettings settings) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("tenantId", tenant.getId());
        values.put("companyName", tenant.getCompanyName());
        values.put("legalName", tenant.getLegalName());
        values.put("supportEmail", tenant.getEmail());
        values.put("supportPhone", tenant.getPhone());
        values.put("timezone", settings.getTimezone());
        values.put("currency", settings.getCurrency());
        values.put("defaultRideLeadTimeMinutes", settings.getDefaultRideLeadTimeMinutes());
        values.put("defaultInvoiceDueDays", settings.getDefaultInvoiceDueDays());
        values.put("invoicePrefix", settings.getInvoicePrefix());
        values.put("paymentPrefix", settings.getPaymentPrefix());
        values.put("pricingRulePrefix", settings.getPricingRulePrefix());
        values.put("taxEnabled", settings.isTaxEnabled());
        values.put("defaultTaxRate", settings.getDefaultTaxRate());
        return values;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}