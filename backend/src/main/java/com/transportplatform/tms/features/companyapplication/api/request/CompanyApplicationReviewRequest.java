package com.transportplatform.tms.features.companyapplication.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyApplicationReviewRequest(
        @Size(max = 2000, message = "Review notes must be 2000 characters or fewer.") String reviewNotes,
        @Size(max = 2000, message = "Rejection reason must be 2000 characters or fewer.") String rejectionReason,
        @Size(max = 50, message = "Subscription plan must be 50 characters or fewer.") String subscriptionPlan,
        @Size(max = 50, message = "Tenant code must be 50 characters or fewer.") String tenantCode,
        @NotBlank(message = "Owner email is required.") @Size(max = 150, message = "Owner email must be 150 characters or fewer.") String ownerEmail,
        @Size(min = 8, max = 100, message = "Owner temporary password must contain between 8 and 100 characters.") String ownerPassword) {
}
