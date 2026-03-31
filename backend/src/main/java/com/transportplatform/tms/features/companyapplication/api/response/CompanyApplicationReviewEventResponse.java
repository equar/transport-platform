package com.transportplatform.tms.features.companyapplication.api.response;

import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationReviewAction;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import java.time.Instant;

public record CompanyApplicationReviewEventResponse(
        Long id,
        CompanyApplicationReviewAction action,
        CompanyApplicationStatus fromStatus,
        CompanyApplicationStatus toStatus,
        String notes,
        String createdBy,
        Instant createdAt) {
}
