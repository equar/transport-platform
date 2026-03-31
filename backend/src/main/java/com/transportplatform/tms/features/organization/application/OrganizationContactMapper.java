package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.api.request.OrganizationContactUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.domain.OrganizationContact;
import org.springframework.stereotype.Component;

@Component
public class OrganizationContactMapper {

    public void apply(OrganizationContact contact, OrganizationContactUpsertRequest request) {
        contact.setFirstName(request.firstName().trim());
        contact.setLastName(request.lastName().trim());
        contact.setTitle(trimToNull(request.title()));
        contact.setDepartment(trimToNull(request.department()));
        contact.setEmail(trimToNull(request.email()));
        contact.setPhone(trimToNull(request.phone()));
        contact.setAlternatePhone(trimToNull(request.alternatePhone()));
        contact.setPreferredCommunicationMethod(request.preferredCommunicationMethod());
        contact.setPrimary(request.primary());
        contact.setNotes(trimToNull(request.notes()));
    }

    public OrganizationContactResponse toResponse(OrganizationContact contact) {
        return new OrganizationContactResponse(
                contact.getId(),
                contact.getOrganization().getId(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getTitle(),
                contact.getDepartment(),
                contact.getEmail(),
                contact.getPhone(),
                contact.getAlternatePhone(),
                contact.getPreferredCommunicationMethod(),
                contact.isPrimary(),
                contact.getNotes(),
                contact.getStatus(),
                contact.getCreatedBy(),
                contact.getCreatedAt(),
                contact.getUpdatedBy(),
                contact.getUpdatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}