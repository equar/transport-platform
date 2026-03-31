package com.transportplatform.tms.features.organization.api.response;

import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import java.time.Instant;
import java.util.List;

public record OrganizationResponse(
        Long id,
        String tenantId,
        String organizationCode,
        OrganizationType organizationType,
        String name,
        String legalName,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        String billingAddressLine1,
        String billingAddressLine2,
        String billingCity,
        String billingState,
        String billingZipCode,
        String billingCountry,
        String primaryPhone,
        String primaryEmail,
        String website,
        String notes,
        OrganizationStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        long contactCount,
        long activeContractCount,
        long linkedRiderCount,
        OrganizationContactResponse primaryContact,
        List<OrganizationContactResponse> contacts,
        List<OrganizationContractSummaryResponse> contracts,
        List<OrganizationLinkedRiderResponse> linkedRiders) {
}