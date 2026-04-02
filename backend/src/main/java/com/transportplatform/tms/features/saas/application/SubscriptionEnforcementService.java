package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlan;
import com.transportplatform.tms.features.saas.domain.TenantSubscription;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionRepository;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionEnforcementService {

    private static final Set<TenantSubscriptionStatus> ENFORCEABLE_STATUSES = Set.of(
            TenantSubscriptionStatus.ACTIVE,
            TenantSubscriptionStatus.TRIAL,
            TenantSubscriptionStatus.SUSPENDED);

    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final AppUserRepository appUserRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RiderRepository riderRepository;
    private final OrganizationRepository organizationRepository;
    private final Clock clock;

    public SubscriptionEnforcementService(TenantSubscriptionRepository tenantSubscriptionRepository,
            AppUserRepository appUserRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            RiderRepository riderRepository,
            OrganizationRepository organizationRepository,
            Clock clock) {
        this.tenantSubscriptionRepository = tenantSubscriptionRepository;
        this.appUserRepository = appUserRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.riderRepository = riderRepository;
        this.organizationRepository = organizationRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public void requireUserCreationAllowed(String tenantId) {
        TenantSubscription subscription = requireActiveSubscription(tenantId, "creating users");
        validateUserQuota(subscription, tenantId);
    }

    @Transactional(readOnly = true)
    public void requireDriverCreationAllowed(String tenantId) {
        TenantSubscription subscription = requireActiveSubscription(tenantId, "creating drivers");
        validateDriverQuota(subscription, tenantId);
    }

    @Transactional(readOnly = true)
    public void requireVehicleCreationAllowed(String tenantId) {
        TenantSubscription subscription = requireActiveSubscription(tenantId, "creating vehicles");
        validateVehicleQuota(subscription, tenantId);
    }

    @Transactional(readOnly = true)
    public void requireRiderCreationAllowed(String tenantId) {
        TenantSubscription subscription = requireActiveSubscription(tenantId, "creating riders");
        validateRiderQuota(subscription, tenantId);
    }

    @Transactional(readOnly = true)
    public void requireOrganizationCreationAllowed(String tenantId) {
        TenantSubscription subscription = requireActiveSubscription(tenantId, "creating organizations");
        validateOrganizationQuota(subscription, tenantId);
    }

    private TenantSubscription requireActiveSubscription(String tenantId, String actionLabel) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }

        TenantSubscription subscription = tenantSubscriptionRepository
                .findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(tenantId,
                        ENFORCEABLE_STATUSES)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.FORBIDDEN,
                        HttpStatus.FORBIDDEN,
                        "The tenant does not have an active subscription for " + actionLabel + "."));

        validateSubscriptionState(subscription, actionLabel);
        return subscription;
    }

    private void validateSubscriptionState(TenantSubscription subscription, String actionLabel) {
        LocalDate today = LocalDate.now(clock);
        if (subscription.getStatus() == TenantSubscriptionStatus.SUSPENDED) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The tenant subscription is suspended. " + capitalize(actionLabel) + " is not available.");
        }
        if (subscription.getEffectiveStartDate() != null && subscription.getEffectiveStartDate().isAfter(today)) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The tenant subscription is not yet active.");
        }
        if (subscription.getEffectiveEndDate() != null && subscription.getEffectiveEndDate().isBefore(today)) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The tenant subscription has ended. User creation is not available.");
        }
        if (subscription.getStatus() == TenantSubscriptionStatus.TRIAL
                && subscription.getTrialEndDate() != null
                && subscription.getTrialEndDate().isBefore(today)) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The tenant trial has expired. " + capitalize(actionLabel) + " is not available.");
        }
    }

    private void validateUserQuota(TenantSubscription subscription, String tenantId) {
        SubscriptionPlan plan = subscription.getSubscriptionPlan();
        if (plan == null) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The tenant subscription plan is unavailable for user creation.");
        }

        long existingUsers = appUserRepository.countByTenantId(tenantId);
        if (existingUsers >= plan.getMaxUsers()) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "The tenant has reached the maximum number of users allowed by the current subscription plan.");
        }
    }

    private void validateDriverQuota(TenantSubscription subscription, String tenantId) {
        SubscriptionPlan plan = requirePlan(subscription, "driver creation");
        long existingDrivers = driverRepository.countByTenantId(tenantId);
        if (existingDrivers >= plan.getMaxDrivers()) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "The tenant has reached the maximum number of drivers allowed by the current subscription plan.");
        }
    }

    private void validateVehicleQuota(TenantSubscription subscription, String tenantId) {
        SubscriptionPlan plan = requirePlan(subscription, "vehicle creation");
        long existingVehicles = vehicleRepository.countByTenantId(tenantId);
        if (existingVehicles >= plan.getMaxVehicles()) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "The tenant has reached the maximum number of vehicles allowed by the current subscription plan.");
        }
    }

    private void validateRiderQuota(TenantSubscription subscription, String tenantId) {
        SubscriptionPlan plan = requirePlan(subscription, "rider creation");
        long existingRiders = riderRepository.countByTenantId(tenantId);
        if (existingRiders >= plan.getMaxRiders()) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "The tenant has reached the maximum number of riders allowed by the current subscription plan.");
        }
    }

    private void validateOrganizationQuota(TenantSubscription subscription, String tenantId) {
        SubscriptionPlan plan = requirePlan(subscription, "organization creation");
        long existingOrganizations = organizationRepository.countByTenantId(tenantId);
        if (existingOrganizations >= plan.getMaxOrganizations()) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "The tenant has reached the maximum number of organizations allowed by the current subscription plan.");
        }
    }

    private SubscriptionPlan requirePlan(TenantSubscription subscription, String actionLabel) {
        SubscriptionPlan plan = subscription.getSubscriptionPlan();
        if (plan == null) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The tenant subscription plan is unavailable for " + actionLabel + ".");
        }
        return plan;
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "This action";
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}