package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import org.springframework.http.HttpStatus;

public final class FeatureFlagStatusWorkflow {

    private FeatureFlagStatusWorkflow() {
    }

    public static void ensureCanActivate(FeatureFlagStatus currentStatus) {
        if (currentStatus == FeatureFlagStatus.ACTIVE) {
            throw invalidTransition("Feature flag is already active.");
        }
    }

    public static void ensureCanDeactivate(FeatureFlagStatus currentStatus) {
        if (currentStatus != FeatureFlagStatus.ACTIVE) {
            throw invalidTransition("Only active feature flags can be deactivated.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}