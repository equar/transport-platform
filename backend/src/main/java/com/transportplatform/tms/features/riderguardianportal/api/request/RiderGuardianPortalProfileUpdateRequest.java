package com.transportplatform.tms.features.riderguardianportal.api.request;

import com.transportplatform.tms.features.rider.domain.GuardianPreferredCommunicationMethod;
import jakarta.validation.constraints.Size;

public record RiderGuardianPortalProfileUpdateRequest(
        @Size(max = 150, message = "Email must be 150 characters or fewer.") String email,
        @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @Size(max = 300, message = "Default pickup address must be 300 characters or fewer.") String defaultPickupAddress,
        @Size(max = 300, message = "Default dropoff address must be 300 characters or fewer.") String defaultDropoffAddress,
        @Size(max = 1000, message = "Pickup notes must be 1000 characters or fewer.") String pickupNotes,
        @Size(max = 1000, message = "Dropoff notes must be 1000 characters or fewer.") String dropoffNotes,
        @Size(max = 2000, message = "Special instructions must be 2000 characters or fewer.") String specialInstructions,
        @Size(max = 150, message = "Emergency contact name must be 150 characters or fewer.") String emergencyContactName,
        @Size(max = 50, message = "Emergency contact phone must be 50 characters or fewer.") String emergencyContactPhone,
        @Size(max = 100, message = "Emergency contact relationship must be 100 characters or fewer.") String emergencyContactRelationship,
        GuardianPreferredCommunicationMethod preferredCommunicationMethod,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}