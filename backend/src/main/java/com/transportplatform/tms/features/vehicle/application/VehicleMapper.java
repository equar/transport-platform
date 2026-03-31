package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.features.vehicle.api.request.VehicleUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleComplianceSummaryResponse;
import com.transportplatform.tms.features.vehicle.api.response.VehicleResponse;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {

    public void apply(Vehicle vehicle, VehicleUpsertRequest request) {
        vehicle.setOwnershipType(request.ownershipType());
        vehicle.setMake(request.make().trim());
        vehicle.setModel(request.model().trim());
        vehicle.setYear(request.year());
        vehicle.setColor(trimToNull(request.color()));
        vehicle.setVin(normalizeVin(request.vin()));
        vehicle.setPlateNumber(normalizePlate(request.plateNumber()));
        vehicle.setPlateState(normalizeState(request.plateState()));
        vehicle.setCapacity(request.capacity());
        vehicle.setWheelchairCapacity(request.wheelchairCapacity() == null ? 0 : request.wheelchairCapacity());
        vehicle.setServiceTypesSupported(normalizeServiceTypes(request.serviceTypesSupported()));
        vehicle.setFuelType(request.fuelType());
        vehicle.setInsurancePolicyNumber(trimToNull(request.insurancePolicyNumber()));
        vehicle.setInsuranceExpiryDate(request.insuranceExpiryDate());
        vehicle.setRegistrationExpiryDate(request.registrationExpiryDate());
        vehicle.setInspectionExpiryDate(request.inspectionExpiryDate());
        vehicle.setMileage(request.mileage());
        vehicle.setAssignedDriverId(request.assignedDriverId());
        vehicle.setNotes(trimToNull(request.notes()));
    }

    public VehicleResponse toResponse(Vehicle vehicle, VehicleComplianceSummaryResponse complianceSummary) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getTenantId(),
                vehicle.getVehicleCode(),
                vehicle.getOwnershipType(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getYear(),
                vehicle.getColor(),
                vehicle.getVin(),
                vehicle.getPlateNumber(),
                vehicle.getPlateState(),
                vehicle.getCapacity(),
                vehicle.getWheelchairCapacity(),
                Set.copyOf(vehicle.getServiceTypesSupported()),
                vehicle.getFuelType(),
                vehicle.getInsurancePolicyNumber(),
                vehicle.getInsuranceExpiryDate(),
                vehicle.getRegistrationExpiryDate(),
                vehicle.getInspectionExpiryDate(),
                vehicle.getMileage(),
                vehicle.getAssignedDriverId(),
                vehicle.getNotes(),
                vehicle.getStatus(),
                vehicle.getCreatedBy(),
                vehicle.getCreatedAt(),
                vehicle.getUpdatedBy(),
                vehicle.getUpdatedAt(),
                complianceSummary);
    }

    private Set<String> normalizeServiceTypes(Set<String> values) {
        if (values == null || values.isEmpty()) {
            return new LinkedHashSet<>();
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            normalized.add(value.trim().toUpperCase(Locale.US));
        }
        return normalized;
    }

    private String normalizeVin(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.US);
    }

    private String normalizePlate(String value) {
        return value.trim().toUpperCase(Locale.US);
    }

    private String normalizeState(String value) {
        return value.trim().toUpperCase(Locale.US);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}