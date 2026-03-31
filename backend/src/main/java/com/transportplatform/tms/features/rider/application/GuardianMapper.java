package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.features.rider.api.request.GuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.GuardianLinkedRiderResponse;
import com.transportplatform.tms.features.rider.api.response.GuardianResponse;
import com.transportplatform.tms.features.rider.domain.Guardian;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class GuardianMapper {

    public void apply(Guardian guardian, GuardianUpsertRequest request) {
        guardian.setFirstName(request.firstName().trim());
        guardian.setMiddleName(trimToNull(request.middleName()));
        guardian.setLastName(request.lastName().trim());
        guardian.setRelationToRiderDefault(trimToNull(request.relationToRiderDefault()));
        guardian.setEmail(trimToNull(request.email()));
        guardian.setPhone(request.phone().trim());
        guardian.setAlternatePhone(trimToNull(request.alternatePhone()));
        guardian.setAddressLine1(trimToNull(request.addressLine1()));
        guardian.setAddressLine2(trimToNull(request.addressLine2()));
        guardian.setCity(trimToNull(request.city()));
        guardian.setState(trimToNull(request.state()));
        guardian.setZipCode(trimToNull(request.zipCode()));
        guardian.setCountry(trimToNull(request.country()));
        guardian.setPreferredCommunicationMethod(request.preferredCommunicationMethod());
        guardian.setBillingContact(request.billingContact());
        guardian.setAuthorizedForPickup(request.authorizedForPickup());
        guardian.setNotes(trimToNull(request.notes()));
    }

    public GuardianResponse toResponse(Guardian guardian,
            long linkedRiderCount,
            List<GuardianLinkedRiderResponse> riders) {
        return new GuardianResponse(
                guardian.getId(),
                guardian.getTenantId(),
                guardian.getFirstName(),
                guardian.getMiddleName(),
                guardian.getLastName(),
                guardian.getRelationToRiderDefault(),
                guardian.getEmail(),
                guardian.getPhone(),
                guardian.getAlternatePhone(),
                guardian.getAddressLine1(),
                guardian.getAddressLine2(),
                guardian.getCity(),
                guardian.getState(),
                guardian.getZipCode(),
                guardian.getCountry(),
                guardian.getPreferredCommunicationMethod(),
                guardian.isBillingContact(),
                guardian.isAuthorizedForPickup(),
                guardian.getNotes(),
                guardian.getStatus(),
                guardian.getCreatedBy(),
                guardian.getCreatedAt(),
                guardian.getUpdatedBy(),
                guardian.getUpdatedAt(),
                linkedRiderCount,
                riders);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}