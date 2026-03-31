package com.transportplatform.tms.features.rider.api.request;

import com.transportplatform.tms.features.rider.domain.RiderGender;
import com.transportplatform.tms.features.rider.domain.RiderMobilityNeed;
import com.transportplatform.tms.features.rider.domain.RiderType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

public record RiderUpsertRequest(
        @NotNull(message = "Rider type is required.") RiderType riderType,
        @NotBlank(message = "First name is required.") @Size(max = 100, message = "First name must be 100 characters or fewer.") String firstName,
        @Size(max = 100, message = "Middle name must be 100 characters or fewer.") String middleName,
        @NotBlank(message = "Last name is required.") @Size(max = 100, message = "Last name must be 100 characters or fewer.") String lastName,
        LocalDate dateOfBirth,
        RiderGender gender,
        @Email(message = "A valid email address is required.") @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @NotBlank(message = "Primary phone is required.") @Pattern(regexp = "^[0-9+()\\-\\s]{7,50}$", message = "Primary phone must be a valid phone number.") @Size(max = 50, message = "Primary phone must be 50 characters or fewer.") String primaryPhone,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,50}$", message = "Alternate phone must be a valid phone number.") @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        @Size(max = 200, message = "Home address line 1 must be 200 characters or fewer.") String homeAddressLine1,
        @Size(max = 200, message = "Home address line 2 must be 200 characters or fewer.") String homeAddressLine2,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @Size(max = 300, message = "Default pickup address must be 300 characters or fewer.") String defaultPickupAddress,
        @Size(max = 300, message = "Default dropoff address must be 300 characters or fewer.") String defaultDropoffAddress,
        @Size(max = 1000, message = "Pickup notes must be 1000 characters or fewer.") String pickupNotes,
        @Size(max = 1000, message = "Dropoff notes must be 1000 characters or fewer.") String dropoffNotes,
        LocalTime preferredPickupWindowStart,
        LocalTime preferredPickupWindowEnd,
        LocalTime preferredDropoffWindowStart,
        LocalTime preferredDropoffWindowEnd,
        Set<RiderMobilityNeed> mobilityNeeds,
        boolean wheelchairRequired,
        boolean escortRequired,
        @Size(max = 2000, message = "Special instructions must be 2000 characters or fewer.") String specialInstructions,
        @Size(max = 2000, message = "Care notes summary must be 2000 characters or fewer.") String careNotesSummary,
        @Size(max = 150, message = "Emergency contact name must be 150 characters or fewer.") String emergencyContactName,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,50}$", message = "Emergency contact phone must be a valid phone number.") @Size(max = 50, message = "Emergency contact phone must be 50 characters or fewer.") String emergencyContactPhone,
        @Size(max = 100, message = "Emergency contact relationship must be 100 characters or fewer.") String emergencyContactRelationship,
        Long organizationId,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}