package com.transportplatform.tms.features.organization.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceAreaCoverageType;
import com.transportplatform.tms.features.organization.domain.ServiceAreaStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import java.time.Instant;
import java.util.Set;

public record ServiceAreaResponse(
        Long id,
        String tenantId,
        String areaCode,
        String name,
        String description,
        ServiceAreaCoverageType coverageType,
        String city,
        String state,
        String zipCode,
        String county,
        Set<ServiceType> serviceTypesSupported,
        String operatingDaysSummary,
        String operatingHoursSummary,
        String notes,
        ServiceAreaStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}