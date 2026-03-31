package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.features.rider.api.request.RiderGuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.GuardianLinkedRiderResponse;
import com.transportplatform.tms.features.rider.api.response.RiderGuardianResponse;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import org.springframework.stereotype.Component;

@Component
public class RiderGuardianMapper {

    public void applyAttributes(RiderGuardian relationship, RiderGuardianUpsertRequest request) {
        relationship.setRelationshipType(request.relationshipType());
        relationship.setAuthorizedForPickup(request.authorizedForPickup());
        relationship.setBillingContact(request.billingContact());
        relationship.setNotes(trimToNull(request.notes()));
    }

    public RiderGuardianResponse toResponse(RiderGuardian relationship) {
        return new RiderGuardianResponse(
                relationship.getId(),
                relationship.getRider().getId(),
                relationship.getGuardian().getId(),
                relationship.getGuardian().getFirstName(),
                relationship.getGuardian().getLastName(),
                buildDisplayName(relationship.getGuardian().getFirstName(), relationship.getGuardian().getLastName()),
                relationship.getGuardian().getEmail(),
                relationship.getGuardian().getPhone(),
                relationship.getGuardian().getStatus(),
                relationship.getRelationshipType(),
                relationship.isPrimaryGuardian(),
                relationship.isAuthorizedForPickup(),
                relationship.isBillingContact(),
                relationship.getStatus(),
                relationship.getNotes(),
                relationship.getCreatedBy(),
                relationship.getCreatedAt(),
                relationship.getUpdatedBy(),
                relationship.getUpdatedAt());
    }

    public GuardianLinkedRiderResponse toGuardianLinkedRiderResponse(RiderGuardian relationship) {
        return new GuardianLinkedRiderResponse(
                relationship.getId(),
                relationship.getRider().getId(),
                relationship.getRider().getRiderCode(),
                buildDisplayName(relationship.getRider().getFirstName(), relationship.getRider().getLastName()),
                relationship.getRider().getRiderType(),
                relationship.getRider().getStatus(),
                relationship.getRider().isWheelchairRequired(),
                relationship.getRider().isEscortRequired(),
                relationship.getRelationshipType(),
                relationship.isPrimaryGuardian(),
                relationship.isAuthorizedForPickup(),
                relationship.isBillingContact(),
                relationship.getStatus(),
                relationship.getNotes());
    }

    private String buildDisplayName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}