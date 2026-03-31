package com.transportplatform.tms.features.compliance.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueStatus;
import org.junit.jupiter.api.Test;

class ComplianceIssueStatusWorkflowTest {

    @Test
    void acknowledgeAllowsOpenIssue() {
        ComplianceIssue issue = issue(ComplianceIssueStatus.OPEN);

        assertDoesNotThrow(() -> ComplianceIssueStatusWorkflow.ensureCanAcknowledge(issue));
    }

    @Test
    void resolveRejectsDismissedIssue() {
        ComplianceIssue issue = issue(ComplianceIssueStatus.DISMISSED);

        ApiException exception = assertThrows(ApiException.class,
                () -> ComplianceIssueStatusWorkflow.ensureCanResolve(issue));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void dismissRejectsResolvedIssue() {
        ComplianceIssue issue = issue(ComplianceIssueStatus.RESOLVED);

        ApiException exception = assertThrows(ApiException.class,
                () -> ComplianceIssueStatusWorkflow.ensureCanDismiss(issue));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    private ComplianceIssue issue(ComplianceIssueStatus issueStatus) {
        ComplianceIssue issue = new ComplianceIssue();
        issue.setIssueStatus(issueStatus);
        return issue;
    }
}