package com.transportplatform.tms.features.organization.api.request;

import com.transportplatform.tms.features.organization.domain.ServiceAreaCoverageType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record ServiceAreaUpsertRequest(
        @NotBlank(message = "Service area name is required.") @Size(max = 150, message = "Service area name must be 150 characters or fewer.") String name,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.") String description,
        @NotNull(message = "Coverage type is required.") ServiceAreaCoverageType coverageType,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "County must be 100 characters or fewer.") String county,
        Set<ServiceType> serviceTypesSupported,
        @Size(max = 200, message = "Operating days summary must be 200 characters or fewer.") String operatingDaysSummary,
        @Size(max = 200, message = "Operating hours summary must be 200 characters or fewer.") String operatingHoursSummary,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}