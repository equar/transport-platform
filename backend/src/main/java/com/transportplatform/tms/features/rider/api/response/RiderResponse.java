package com.transportplatform.tms.features.rider.api.response;

import com.transportplatform.tms.features.rider.domain.RiderGender;
import com.transportplatform.tms.features.rider.domain.RiderMobilityNeed;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public record RiderResponse(
        Long id,
        String tenantId,
        String riderCode,
        RiderType riderType,
        String firstName,
        String middleName,
        String lastName,
        LocalDate dateOfBirth,
        RiderGender gender,
        String email,
        String primaryPhone,
        String alternatePhone,
        String homeAddressLine1,
        String homeAddressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        String defaultPickupAddress,
        String defaultDropoffAddress,
        String pickupNotes,
        String dropoffNotes,
        LocalTime preferredPickupWindowStart,
        LocalTime preferredPickupWindowEnd,
        LocalTime preferredDropoffWindowStart,
        LocalTime preferredDropoffWindowEnd,
        Set<RiderMobilityNeed> mobilityNeeds,
        boolean wheelchairRequired,
        boolean escortRequired,
        String specialInstructions,
        String careNotesSummary,
        String emergencyContactName,
        String emergencyContactPhone,
        String emergencyContactRelationship,
        Long organizationId,
        String notes,
        RiderStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        long guardianCount,
        RiderGuardianResponse primaryGuardian,
        List<RiderGuardianResponse> guardians) {
}