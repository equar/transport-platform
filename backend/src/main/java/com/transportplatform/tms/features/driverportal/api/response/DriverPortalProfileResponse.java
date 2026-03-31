package com.transportplatform.tms.features.driverportal.api.response;

import com.transportplatform.tms.features.driver.domain.DriverStatus;
import java.time.Instant;
import java.time.LocalDate;

public record DriverPortalProfileResponse(
        Long id,
        String driverCode,
        String firstName,
        String lastName,
        String email,
        String phone,
        String alternatePhone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        String availabilitySummary,
        String emergencyContactName,
        String emergencyContactPhone,
        String emergencyContactRelationship,
        String notes,
        DriverStatus status,
        LocalDate licenseExpiryDate,
        LocalDate backgroundCheckExpiryDate,
        LocalDate drugTestExpiryDate,
        LocalDate trainingCompletionDate,
        Instant updatedAt) {
}