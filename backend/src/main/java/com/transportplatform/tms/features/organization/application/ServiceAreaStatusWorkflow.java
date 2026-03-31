package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.ServiceAreaStatus;
import org.springframework.http.HttpStatus;

public final class ServiceAreaStatusWorkflow {

    private ServiceAreaStatusWorkflow() {
    }

    public static void ensureCanActivate(ServiceAreaStatus currentStatus) {
        if (currentStatus != ServiceAreaStatus.INACTIVE) {
            throw invalidTransition("Only inactive service areas can be activated.");
        }
    }

    public static void ensureCanDeactivate(ServiceAreaStatus currentStatus) {
        if (currentStatus == ServiceAreaStatus.INACTIVE) {
            throw invalidTransition("Service area is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}