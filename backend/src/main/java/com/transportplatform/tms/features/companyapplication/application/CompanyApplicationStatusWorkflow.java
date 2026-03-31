package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import org.springframework.http.HttpStatus;

public final class CompanyApplicationStatusWorkflow {

    private CompanyApplicationStatusWorkflow() {
    }

    public static void ensureCanMoveToUnderReview(CompanyApplicationStatus currentStatus) {
        if (currentStatus != CompanyApplicationStatus.SUBMITTED) {
            throw invalidTransition(currentStatus, CompanyApplicationStatus.UNDER_REVIEW);
        }
    }

    public static void ensureCanApprove(CompanyApplicationStatus currentStatus) {
        if (currentStatus != CompanyApplicationStatus.SUBMITTED
                && currentStatus != CompanyApplicationStatus.UNDER_REVIEW) {
            throw invalidTransition(currentStatus, CompanyApplicationStatus.APPROVED);
        }
    }

    public static void ensureCanReject(CompanyApplicationStatus currentStatus, String rejectionReason) {
        if (currentStatus != CompanyApplicationStatus.SUBMITTED
                && currentStatus != CompanyApplicationStatus.UNDER_REVIEW) {
            throw invalidTransition(currentStatus, CompanyApplicationStatus.REJECTED);
        }
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "A rejection reason is required when rejecting an application.");
        }
    }

    private static ApiException invalidTransition(CompanyApplicationStatus currentStatus,
            CompanyApplicationStatus targetStatus) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.CONFLICT,
                "Application cannot transition from " + currentStatus + " to " + targetStatus + ".");
    }
}
