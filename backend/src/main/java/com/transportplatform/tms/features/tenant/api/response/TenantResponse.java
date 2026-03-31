package com.transportplatform.tms.features.tenant.api.response;

import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.time.Instant;
import java.util.Set;

public record TenantResponse(
        String id,
        String tenantCode,
        String companyName,
        String legalName,
        String email,
        String phone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        String businessType,
        String subscriptionPlan,
        Set<String> serviceTypesEnabled,
        String notes,
        TenantStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}
