package com.transportplatform.tms.features.runtime.api.response;

public record RuntimeTenantProfileResponse(
        String tenantId,
        String tenantCode,
        String companyName,
        String legalName,
        String tenantStatus) {
}