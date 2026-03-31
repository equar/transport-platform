package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import org.springframework.http.HttpStatus;

public final class ComplianceIssueStatusWorkflow {

    private ComplianceIssueStatusWorkflow() {
    }

    public static void ensureCanAcknowledge(ComplianceIssue issue) {
        if (issue.getIssueStatus() == ComplianceIssueStatus.ACKNOWLEDGED) {
            throw invalidTransition("Compliance issue is already acknowledged.");
        }
        if (issue.getIssueStatus() == ComplianceIssueStatus.RESOLVED
                || issue.getIssueStatus() == ComplianceIssueStatus.DISMISSED) {
            throw invalidTransition("Closed compliance issues cannot be acknowledged.");
        }
    }

    public static void ensureCanResolve(ComplianceIssue issue) {
        if (issue.getIssueStatus() == ComplianceIssueStatus.RESOLVED) {
            throw invalidTransition("Compliance issue is already resolved.");
        }
        if (issue.getIssueStatus() == ComplianceIssueStatus.DISMISSED) {
            throw invalidTransition("Dismissed compliance issues cannot be resolved.");
        }
    }

    public static void ensureCanDismiss(ComplianceIssue issue) {
        if (issue.getIssueStatus() == ComplianceIssueStatus.DISMISSED) {
            throw invalidTransition("Compliance issue is already dismissed.");
        }
        if (issue.getIssueStatus() == ComplianceIssueStatus.RESOLVED) {
            throw invalidTransition("Resolved compliance issues cannot be dismissed.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}