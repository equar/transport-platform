package com.transportplatform.tms.features.driver.api.request;

import com.transportplatform.tms.features.driver.domain.DriverQualificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record DriverUpsertRequest(
        @NotBlank(message = "First name is required.") @Size(max = 100, message = "First name must be 100 characters or fewer.") String firstName,
        @Size(max = 100, message = "Middle name must be 100 characters or fewer.") String middleName,
        @NotBlank(message = "Last name is required.") @Size(max = 100, message = "Last name must be 100 characters or fewer.") String lastName,
        LocalDate dateOfBirth,
        @Email(message = "A valid email address is required.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @NotBlank(message = "Phone is required.") @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @NotNull(message = "Driver type is required.") DriverType driverType,
        LocalDate hireDate,
        LocalDate startDate,
        @Size(max = 200, message = "Availability summary must be 200 characters or fewer.") String availabilitySummary,
        @Size(max = 80, message = "License number must be 80 characters or fewer.") String licenseNumber,
        @Size(max = 80, message = "License state must be 80 characters or fewer.") String licenseState,
        LocalDate licenseExpiryDate,
        DriverQualificationStatus backgroundCheckStatus,
        LocalDate backgroundCheckExpiryDate,
        DriverQualificationStatus drugTestStatus,
        LocalDate drugTestExpiryDate,
        DriverTrainingStatus trainingStatus,
        LocalDate trainingCompletionDate,
        @Size(max = 150, message = "Emergency contact name must be 150 characters or fewer.") String emergencyContactName,
        @Size(max = 50, message = "Emergency contact phone must be 50 characters or fewer.") String emergencyContactPhone,
        @Size(max = 100, message = "Emergency contact relationship must be 100 characters or fewer.") String emergencyContactRelationship,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}