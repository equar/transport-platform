package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import org.springframework.http.HttpStatus;

public final class GuardianStatusWorkflow {

    private GuardianStatusWorkflow() {
    }

    public static void ensureCanActivate(GuardianStatus currentStatus) {
        if (currentStatus != GuardianStatus.PENDING
                && currentStatus != GuardianStatus.SUSPENDED
                && currentStatus != GuardianStatus.INACTIVE) {
            throw invalidTransition("Only pending, suspended, or inactive guardians can be activated.");
        }
    }

    public static void ensureCanSuspend(GuardianStatus currentStatus) {
        if (currentStatus != GuardianStatus.PENDING && currentStatus != GuardianStatus.ACTIVE) {
            throw invalidTransition("Only pending or active guardians can be suspended.");
        }
    }

    public static void ensureCanDeactivate(GuardianStatus currentStatus) {
        if (currentStatus == GuardianStatus.INACTIVE) {
            throw invalidTransition("Guardian is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}