package com.transportplatform.tms.features.companyapplication.api.response;

import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public record CompanyApplicationResponse(
        Long id,
        String applicationNumber,
        String legalCompanyName,
        String dbaName,
        String contactFirstName,
        String contactLastName,
        String email,
        String phone,
        String businessType,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        Set<String> requestedServiceTypes,
        Integer fleetSize,
        Integer numberOfDrivers,
        String notes,
        String reviewNotes,
        String rejectionReason,
        CompanyApplicationStatus status,
        String approvedTenantId,
        Long ownerUserId,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        List<CompanyApplicationReviewEventResponse> reviewEvents) {
}
