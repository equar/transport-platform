package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.OrganizationContactStatus;
import org.springframework.http.HttpStatus;

public final class OrganizationContactStatusWorkflow {

    private OrganizationContactStatusWorkflow() {
    }

    public static void ensureCanActivate(OrganizationContactStatus currentStatus) {
        if (currentStatus != OrganizationContactStatus.INACTIVE) {
            throw invalidTransition("Only inactive contacts can be activated.");
        }
    }

    public static void ensureCanDeactivate(OrganizationContactStatus currentStatus) {
        if (currentStatus == OrganizationContactStatus.INACTIVE) {
            throw invalidTransition("Organization contact is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}