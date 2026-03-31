package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.api.request.OrganizationUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationContractSummaryResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationLinkedRiderResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationResponse;
import com.transportplatform.tms.features.organization.domain.Organization;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OrganizationMapper {

    public void apply(Organization organization, OrganizationUpsertRequest request) {
        organization.setOrganizationType(request.organizationType());
        organization.setName(request.name().trim());
        organization.setLegalName(trimToNull(request.legalName()));
        organization.setAddressLine1(trimToNull(request.addressLine1()));
        organization.setAddressLine2(trimToNull(request.addressLine2()));
        organization.setCity(trimToNull(request.city()));
        organization.setState(trimToNull(request.state()));
        organization.setZipCode(trimToNull(request.zipCode()));
        organization.setCountry(trimToNull(request.country()));
        organization.setBillingAddressLine1(trimToNull(request.billingAddressLine1()));
        organization.setBillingAddressLine2(trimToNull(request.billingAddressLine2()));
        organization.setBillingCity(trimToNull(request.billingCity()));
        organization.setBillingState(trimToNull(request.billingState()));
        organization.setBillingZipCode(trimToNull(request.billingZipCode()));
        organization.setBillingCountry(trimToNull(request.billingCountry()));
        organization.setPrimaryPhone(trimToNull(request.primaryPhone()));
        organization.setPrimaryEmail(trimToNull(request.primaryEmail()));
        organization.setWebsite(trimToNull(request.website()));
        organization.setNotes(trimToNull(request.notes()));
    }

    public OrganizationResponse toResponse(Organization organization,
            long contactCount,
            long activeContractCount,
            long linkedRiderCount,
            OrganizationContactResponse primaryContact,
            List<OrganizationContactResponse> contacts,
            List<OrganizationContractSummaryResponse> contracts,
            List<OrganizationLinkedRiderResponse> linkedRiders) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getTenantId(),
                organization.getOrganizationCode(),
                organization.getOrganizationType(),
                organization.getName(),
                organization.getLegalName(),
                organization.getAddressLine1(),
                organization.getAddressLine2(),
                organization.getCity(),
                organization.getState(),
                organization.getZipCode(),
                organization.getCountry(),
                organization.getBillingAddressLine1(),
                organization.getBillingAddressLine2(),
                organization.getBillingCity(),
                organization.getBillingState(),
                organization.getBillingZipCode(),
                organization.getBillingCountry(),
                organization.getPrimaryPhone(),
                organization.getPrimaryEmail(),
                organization.getWebsite(),
                organization.getNotes(),
                organization.getStatus(),
                organization.getCreatedBy(),
                organization.getCreatedAt(),
                organization.getUpdatedBy(),
                organization.getUpdatedAt(),
                contactCount,
                activeContractCount,
                linkedRiderCount,
                primaryContact,
                contacts,
                contracts,
                linkedRiders);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}