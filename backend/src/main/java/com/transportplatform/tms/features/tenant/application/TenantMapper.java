package com.transportplatform.tms.features.tenant.application;

import com.transportplatform.tms.features.tenant.api.request.TenantUpsertRequest;
import com.transportplatform.tms.features.tenant.api.response.TenantResponse;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import java.util.LinkedHashSet;
import org.springframework.stereotype.Component;

@Component
public class TenantMapper {

    public void apply(Tenant tenant, TenantUpsertRequest request) {
        tenant.setTenantCode(request.tenantCode().trim().toUpperCase());
        tenant.setCompanyName(request.companyName().trim());
        tenant.setLegalName(request.legalName().trim());
        tenant.setEmail(request.email().trim().toLowerCase());
        tenant.setPhone(request.phone().trim());
        tenant.setAddressLine1(request.addressLine1().trim());
        tenant.setAddressLine2(request.addressLine2() == null ? null : request.addressLine2().trim());
        tenant.setCity(request.city().trim());
        tenant.setState(request.state().trim());
        tenant.setZipCode(request.zipCode().trim());
        tenant.setCountry(request.country().trim());
        tenant.setBusinessType(request.businessType().trim());
        tenant.setSubscriptionPlan(request.subscriptionPlan().trim().toUpperCase());
        tenant.setServiceTypesEnabled(
                new LinkedHashSet<>(request.serviceTypesEnabled().stream().map(String::trim).toList()));
        tenant.setNotes(request.notes() == null ? null : request.notes().trim());
    }

    public TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getTenantCode(),
                tenant.getCompanyName(),
                tenant.getLegalName(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getAddressLine1(),
                tenant.getAddressLine2(),
                tenant.getCity(),
                tenant.getState(),
                tenant.getZipCode(),
                tenant.getCountry(),
                tenant.getBusinessType(),
                tenant.getSubscriptionPlan(),
                tenant.getServiceTypesEnabled(),
                tenant.getNotes(),
                tenant.getStatus(),
                tenant.getCreatedBy(),
                tenant.getCreatedAt(),
                tenant.getUpdatedBy(),
                tenant.getUpdatedAt());
    }
}
