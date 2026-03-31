package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import org.springframework.http.HttpStatus;

public final class SubscriptionPlanStatusWorkflow {

    private SubscriptionPlanStatusWorkflow() {
    }

    public static void ensureCanActivate(SubscriptionPlanStatus currentStatus) {
        if (currentStatus == SubscriptionPlanStatus.ACTIVE) {
            throw invalidTransition("Subscription plan is already active.");
        }
    }

    public static void ensureCanDeactivate(SubscriptionPlanStatus currentStatus) {
        if (currentStatus != SubscriptionPlanStatus.ACTIVE) {
            throw invalidTransition("Only active subscription plans can be deactivated.");
        }
    }

    public static void ensureCanRetire(SubscriptionPlanStatus currentStatus) {
        if (currentStatus == SubscriptionPlanStatus.RETIRED) {
            throw invalidTransition("Subscription plan is already retired.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}