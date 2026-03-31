package com.transportplatform.tms.features.vehicle.api.request;

import com.transportplatform.tms.features.vehicle.domain.VehicleFuelType;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;

public record VehicleUpsertRequest(
        @NotNull(message = "Ownership type is required.") VehicleOwnershipType ownershipType,
        @NotBlank(message = "Make is required.") @Size(max = 120, message = "Make must be 120 characters or fewer.") String make,
        @NotBlank(message = "Model is required.") @Size(max = 120, message = "Model must be 120 characters or fewer.") String model,
        @NotNull(message = "Year is required.") @Min(value = 1980, message = "Year must be 1980 or later.") Integer year,
        @Size(max = 80, message = "Color must be 80 characters or fewer.") String color,
        @Size(max = 17, message = "VIN must be 17 characters or fewer.") String vin,
        @NotBlank(message = "Plate number is required.") @Size(max = 30, message = "Plate number must be 30 characters or fewer.") String plateNumber,
        @NotBlank(message = "Plate state is required.") @Size(max = 80, message = "Plate state must be 80 characters or fewer.") String plateState,
        @NotNull(message = "Capacity is required.") @Min(value = 1, message = "Capacity must be at least 1.") Integer capacity,
        @Min(value = 0, message = "Wheelchair capacity cannot be negative.") Integer wheelchairCapacity,
        Set<String> serviceTypesSupported,
        VehicleFuelType fuelType,
        @Size(max = 120, message = "Insurance policy number must be 120 characters or fewer.") String insurancePolicyNumber,
        LocalDate insuranceExpiryDate,
        LocalDate registrationExpiryDate,
        LocalDate inspectionExpiryDate,
        @Min(value = 0, message = "Mileage cannot be negative.") Long mileage,
        @Min(value = 1, message = "Assigned driver reference must be positive.") Long assignedDriverId,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}