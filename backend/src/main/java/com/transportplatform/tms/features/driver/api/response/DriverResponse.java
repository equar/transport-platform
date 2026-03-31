package com.transportplatform.tms.features.driver.api.response;

import com.transportplatform.tms.features.driver.domain.DriverQualificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import java.time.Instant;
import java.time.LocalDate;

public record DriverResponse(
        Long id,
        String tenantId,
        String driverCode,
        String firstName,
        String middleName,
        String lastName,
        LocalDate dateOfBirth,
        String email,
        String phone,
        String alternatePhone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String zipCode,
        String country,
        DriverType driverType,
        DriverStatus status,
        LocalDate hireDate,
        LocalDate startDate,
        String availabilitySummary,
        String licenseNumber,
        String licenseState,
        LocalDate licenseExpiryDate,
        DriverQualificationStatus backgroundCheckStatus,
        LocalDate backgroundCheckExpiryDate,
        DriverQualificationStatus drugTestStatus,
        LocalDate drugTestExpiryDate,
        DriverTrainingStatus trainingStatus,
        LocalDate trainingCompletionDate,
        String emergencyContactName,
        String emergencyContactPhone,
        String emergencyContactRelationship,
        String notes,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        DriverComplianceSummaryResponse complianceSummary) {
}