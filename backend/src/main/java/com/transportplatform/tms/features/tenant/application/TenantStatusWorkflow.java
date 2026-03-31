package com.transportplatform.tms.features.tenant.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import org.springframework.http.HttpStatus;

public final class TenantStatusWorkflow {

    private TenantStatusWorkflow() {
    }

    public static void ensureCanActivate(TenantStatus currentStatus) {
        if (currentStatus == TenantStatus.ACTIVE) {
            throw invalidTransition("Tenant is already active.");
        }
    }

    public static void ensureCanSuspend(TenantStatus currentStatus) {
        if (currentStatus != TenantStatus.ACTIVE) {
            throw invalidTransition("Only active tenants can be suspended.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}