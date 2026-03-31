package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import org.springframework.http.HttpStatus;

public final class RiderStatusWorkflow {

    private RiderStatusWorkflow() {
    }

    public static void ensureCanActivate(RiderStatus currentStatus) {
        if (currentStatus != RiderStatus.PENDING
                && currentStatus != RiderStatus.SUSPENDED
                && currentStatus != RiderStatus.WAITLISTED
                && currentStatus != RiderStatus.INACTIVE) {
            throw invalidTransition("Only pending, suspended, waitlisted, or inactive riders can be activated.");
        }
    }

    public static void ensureCanSuspend(RiderStatus currentStatus) {
        if (currentStatus != RiderStatus.PENDING && currentStatus != RiderStatus.ACTIVE) {
            throw invalidTransition("Only pending or active riders can be suspended.");
        }
    }

    public static void ensureCanWaitlist(RiderStatus currentStatus) {
        if (currentStatus != RiderStatus.PENDING
                && currentStatus != RiderStatus.ACTIVE
                && currentStatus != RiderStatus.SUSPENDED) {
            throw invalidTransition("Only pending, active, or suspended riders can be moved to the waitlist.");
        }
    }

    public static void ensureCanDeactivate(RiderStatus currentStatus) {
        if (currentStatus == RiderStatus.INACTIVE) {
            throw invalidTransition("Rider is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}