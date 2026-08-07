package com.transportplatform.tms.features.tenant.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class TenantResourceProvisioningService {

    private final TenantSettingsRepository tenantSettingsRepository;
    private final AppUserRepository appUserRepository;

    public TenantResourceProvisioningService(TenantSettingsRepository tenantSettingsRepository,
            AppUserRepository appUserRepository) {
        this.tenantSettingsRepository = tenantSettingsRepository;
        this.appUserRepository = appUserRepository;
    }

    public void initialize(String tenantId) {
        if (tenantSettingsRepository.existsById(tenantId)) {
            return;
        }
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
        settings.setDefaultNotificationPreferencesSummary(
                "In-app notifications enabled for operational alerts.");
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
        tenantSettingsRepository.save(settings);
    }

    public void ensureReadyForActivation(String tenantId) {
        if (appUserRepository.countByRoleAndTenantScopeAndStatus(
                RoleName.ROLE_TENANT_ADMIN, tenantId, UserStatus.ACTIVE) == 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Create an active tenant administrator before activating this tenant.");
        }
        initialize(tenantId);
    }
}
