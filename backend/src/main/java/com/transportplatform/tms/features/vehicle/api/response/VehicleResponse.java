package com.transportplatform.tms.features.vehicle.api.response;

import com.transportplatform.tms.features.vehicle.domain.VehicleFuelType;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record VehicleResponse(
        Long id,
        String tenantId,
        String vehicleCode,
        VehicleOwnershipType ownershipType,
        String make,
        String model,
        Integer year,
        String color,
        String vin,
        String plateNumber,
        String plateState,
        Integer capacity,
        Integer wheelchairCapacity,
        Set<String> serviceTypesSupported,
        VehicleFuelType fuelType,
        String insurancePolicyNumber,
        LocalDate insuranceExpiryDate,
        LocalDate registrationExpiryDate,
        LocalDate inspectionExpiryDate,
        Long mileage,
        Long assignedDriverId,
        String notes,
        VehicleStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        VehicleComplianceSummaryResponse complianceSummary) {
}