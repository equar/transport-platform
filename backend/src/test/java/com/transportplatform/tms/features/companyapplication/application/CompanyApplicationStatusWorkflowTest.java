package com.transportplatform.tms.features.companyapplication.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import org.junit.jupiter.api.Test;

class CompanyApplicationStatusWorkflowTest {

    @Test
    void approveAllowsSubmittedAndUnderReviewStatuses() {
        assertDoesNotThrow(() -> CompanyApplicationStatusWorkflow.ensureCanApprove(CompanyApplicationStatus.SUBMITTED));
        assertDoesNotThrow(
                () -> CompanyApplicationStatusWorkflow.ensureCanApprove(CompanyApplicationStatus.UNDER_REVIEW));
    }

    @Test
    void approveRejectsInvalidStatus() {
        assertThrows(ApiException.class,
                () -> CompanyApplicationStatusWorkflow.ensureCanApprove(CompanyApplicationStatus.REJECTED));
    }

    @Test
    void rejectRequiresReason() {
        assertThrows(ApiException.class,
                () -> CompanyApplicationStatusWorkflow.ensureCanReject(CompanyApplicationStatus.SUBMITTED, "  "));
    }
}
