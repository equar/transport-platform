package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.features.rider.api.request.RiderUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.RiderGuardianResponse;
import com.transportplatform.tms.features.rider.api.response.RiderResponse;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderMobilityNeed;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class RiderMapper {

    public void apply(Rider rider, RiderUpsertRequest request) {
        rider.setRiderType(request.riderType());
        rider.setFirstName(request.firstName().trim());
        rider.setMiddleName(trimToNull(request.middleName()));
        rider.setLastName(request.lastName().trim());
        rider.setDateOfBirth(request.dateOfBirth());
        rider.setGender(request.gender());
        rider.setEmail(trimToNull(request.email()));
        rider.setPrimaryPhone(request.primaryPhone().trim());
        rider.setAlternatePhone(trimToNull(request.alternatePhone()));
        rider.setHomeAddressLine1(trimToNull(request.homeAddressLine1()));
        rider.setHomeAddressLine2(trimToNull(request.homeAddressLine2()));
        rider.setCity(trimToNull(request.city()));
        rider.setState(trimToNull(request.state()));
        rider.setZipCode(trimToNull(request.zipCode()));
        rider.setCountry(trimToNull(request.country()));
        rider.setDefaultPickupAddress(trimToNull(request.defaultPickupAddress()));
        rider.setDefaultDropoffAddress(trimToNull(request.defaultDropoffAddress()));
        rider.setPickupNotes(trimToNull(request.pickupNotes()));
        rider.setDropoffNotes(trimToNull(request.dropoffNotes()));
        rider.setPreferredPickupWindowStart(request.preferredPickupWindowStart());
        rider.setPreferredPickupWindowEnd(request.preferredPickupWindowEnd());
        rider.setPreferredDropoffWindowStart(request.preferredDropoffWindowStart());
        rider.setPreferredDropoffWindowEnd(request.preferredDropoffWindowEnd());
        rider.setMobilityNeeds(normalizeMobilityNeeds(request.mobilityNeeds()));
        rider.setWheelchairRequired(request.wheelchairRequired());
        rider.setEscortRequired(request.escortRequired());
        rider.setSpecialInstructions(trimToNull(request.specialInstructions()));
        rider.setCareNotesSummary(trimToNull(request.careNotesSummary()));
        rider.setEmergencyContactName(trimToNull(request.emergencyContactName()));
        rider.setEmergencyContactPhone(trimToNull(request.emergencyContactPhone()));
        rider.setEmergencyContactRelationship(trimToNull(request.emergencyContactRelationship()));
        rider.setOrganizationId(request.organizationId());
        rider.setNotes(trimToNull(request.notes()));
    }

    public RiderResponse toResponse(Rider rider,
            long guardianCount,
            RiderGuardianResponse primaryGuardian,
            List<RiderGuardianResponse> guardians) {
        return new RiderResponse(
                rider.getId(),
                rider.getTenantId(),
                rider.getRiderCode(),
                rider.getRiderType(),
                rider.getFirstName(),
                rider.getMiddleName(),
                rider.getLastName(),
                rider.getDateOfBirth(),
                rider.getGender(),
                rider.getEmail(),
                rider.getPrimaryPhone(),
                rider.getAlternatePhone(),
                rider.getHomeAddressLine1(),
                rider.getHomeAddressLine2(),
                rider.getCity(),
                rider.getState(),
                rider.getZipCode(),
                rider.getCountry(),
                rider.getDefaultPickupAddress(),
                rider.getDefaultDropoffAddress(),
                rider.getPickupNotes(),
                rider.getDropoffNotes(),
                rider.getPreferredPickupWindowStart(),
                rider.getPreferredPickupWindowEnd(),
                rider.getPreferredDropoffWindowStart(),
                rider.getPreferredDropoffWindowEnd(),
                Set.copyOf(rider.getMobilityNeeds()),
                rider.isWheelchairRequired(),
                rider.isEscortRequired(),
                rider.getSpecialInstructions(),
                rider.getCareNotesSummary(),
                rider.getEmergencyContactName(),
                rider.getEmergencyContactPhone(),
                rider.getEmergencyContactRelationship(),
                rider.getOrganizationId(),
                rider.getNotes(),
                rider.getStatus(),
                rider.getCreatedBy(),
                rider.getCreatedAt(),
                rider.getUpdatedBy(),
                rider.getUpdatedAt(),
                guardianCount,
                primaryGuardian,
                guardians);
    }

    private Set<RiderMobilityNeed> normalizeMobilityNeeds(Set<RiderMobilityNeed> mobilityNeeds) {
        if (mobilityNeeds == null || mobilityNeeds.isEmpty()) {
            return new LinkedHashSet<>();
        }
        return new LinkedHashSet<>(mobilityNeeds);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}