package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import org.springframework.http.HttpStatus;

public final class TenantSubscriptionStatusWorkflow {

    private TenantSubscriptionStatusWorkflow() {
    }

    public static void ensureValidForUpsert(TenantSubscriptionStatus status, boolean trial,
            java.time.LocalDate trialEndDate) {
        if (trial && status != TenantSubscriptionStatus.TRIAL) {
            throw invalidTransition("Trial subscriptions must use TRIAL status.");
        }
        if (!trial && status == TenantSubscriptionStatus.TRIAL) {
            throw invalidTransition("TRIAL status requires the trial flag.");
        }
        if (trial && trialEndDate == null) {
            throw invalidTransition("Trial subscriptions require a trial end date.");
        }
    }

    public static void ensureCanActivate(TenantSubscriptionStatus status) {
        if (status == TenantSubscriptionStatus.ACTIVE) {
            throw invalidTransition("Tenant subscription is already active.");
        }
    }

    public static void ensureCanSuspend(TenantSubscriptionStatus status) {
        if (status != TenantSubscriptionStatus.ACTIVE && status != TenantSubscriptionStatus.TRIAL) {
            throw invalidTransition("Only active or trial subscriptions can be suspended.");
        }
    }

    public static void ensureCanCancel(TenantSubscriptionStatus status) {
        if (status == TenantSubscriptionStatus.CANCELLED || status == TenantSubscriptionStatus.EXPIRED) {
            throw invalidTransition("Only active subscription records can be cancelled.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}