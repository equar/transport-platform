package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import org.springframework.http.HttpStatus;

public final class OrganizationStatusWorkflow {

    private OrganizationStatusWorkflow() {
    }

    public static void ensureCanActivate(OrganizationStatus currentStatus) {
        if (currentStatus != OrganizationStatus.PENDING
                && currentStatus != OrganizationStatus.SUSPENDED
                && currentStatus != OrganizationStatus.INACTIVE) {
            throw invalidTransition("Only pending, suspended, or inactive organizations can be activated.");
        }
    }

    public static void ensureCanSuspend(OrganizationStatus currentStatus) {
        if (currentStatus != OrganizationStatus.PENDING && currentStatus != OrganizationStatus.ACTIVE) {
            throw invalidTransition("Only pending or active organizations can be suspended.");
        }
    }

    public static void ensureCanDeactivate(OrganizationStatus currentStatus) {
        if (currentStatus == OrganizationStatus.INACTIVE) {
            throw invalidTransition("Organization is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}