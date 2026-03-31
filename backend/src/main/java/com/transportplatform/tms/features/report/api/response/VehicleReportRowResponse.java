package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.time.Instant;
import java.time.LocalDate;

public record VehicleReportRowResponse(
        Long id,
        String vehicleCode,
        String vehicleName,
        VehicleStatus status,
        VehicleOwnershipType ownershipType,
        Integer capacity,
        String plateNumber,
        LocalDate insuranceExpiryDate,
        LocalDate registrationExpiryDate,
        LocalDate inspectionExpiryDate,
        Instant createdAt) {
}