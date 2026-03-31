package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.api.request.ServiceAreaUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.ServiceAreaResponse;
import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ServiceAreaMapper {

    public void apply(ServiceArea serviceArea, ServiceAreaUpsertRequest request) {
        serviceArea.setName(request.name().trim());
        serviceArea.setDescription(trimToNull(request.description()));
        serviceArea.setCoverageType(request.coverageType());
        serviceArea.setCity(trimToNull(request.city()));
        serviceArea.setState(trimToNull(request.state()));
        serviceArea.setZipCode(trimToNull(request.zipCode()));
        serviceArea.setCounty(trimToNull(request.county()));
        serviceArea.setServiceTypesSupported(normalize(request.serviceTypesSupported()));
        serviceArea.setOperatingDaysSummary(trimToNull(request.operatingDaysSummary()));
        serviceArea.setOperatingHoursSummary(trimToNull(request.operatingHoursSummary()));
        serviceArea.setNotes(trimToNull(request.notes()));
    }

    public ServiceAreaResponse toResponse(ServiceArea serviceArea) {
        return new ServiceAreaResponse(
                serviceArea.getId(),
                serviceArea.getTenantId(),
                serviceArea.getAreaCode(),
                serviceArea.getName(),
                serviceArea.getDescription(),
                serviceArea.getCoverageType(),
                serviceArea.getCity(),
                serviceArea.getState(),
                serviceArea.getZipCode(),
                serviceArea.getCounty(),
                Set.copyOf(serviceArea.getServiceTypesSupported()),
                serviceArea.getOperatingDaysSummary(),
                serviceArea.getOperatingHoursSummary(),
                serviceArea.getNotes(),
                serviceArea.getStatus(),
                serviceArea.getCreatedBy(),
                serviceArea.getCreatedAt(),
                serviceArea.getUpdatedBy(),
                serviceArea.getUpdatedAt());
    }

    private Set<ServiceType> normalize(Set<ServiceType> values) {
        if (values == null || values.isEmpty()) {
            return new LinkedHashSet<>();
        }
        return new LinkedHashSet<>(values);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}