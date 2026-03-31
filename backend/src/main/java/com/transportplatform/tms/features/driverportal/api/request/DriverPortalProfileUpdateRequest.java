package com.transportplatform.tms.features.driverportal.api.request;

import jakarta.validation.constraints.Size;

public record DriverPortalProfileUpdateRequest(
        @Size(max = 50, message = "Phone must be 50 characters or fewer.") String phone,
        @Size(max = 50, message = "Alternate phone must be 50 characters or fewer.") String alternatePhone,
        @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @Size(max = 200, message = "Availability summary must be 200 characters or fewer.") String availabilitySummary,
        @Size(max = 150, message = "Emergency contact name must be 150 characters or fewer.") String emergencyContactName,
        @Size(max = 50, message = "Emergency contact phone must be 50 characters or fewer.") String emergencyContactPhone,
        @Size(max = 100, message = "Emergency contact relationship must be 100 characters or fewer.") String emergencyContactRelationship,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}