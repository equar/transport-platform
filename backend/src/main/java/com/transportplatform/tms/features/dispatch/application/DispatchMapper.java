package com.transportplatform.tms.features.dispatch.application;

import com.transportplatform.tms.features.dispatch.api.response.DispatchRideMapResponse;
import com.transportplatform.tms.features.dispatch.api.response.DispatchRideSummaryResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.location.domain.DriverLocationSnapshot;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import org.springframework.stereotype.Component;

@Component
public class DispatchMapper {

    public DispatchRideSummaryResponse toSummaryResponse(Ride ride,
            Driver driver,
            Vehicle vehicle,
            DispatchAssignmentValidationService.DispatchWarnings warnings) {
        return new DispatchRideSummaryResponse(
                ride.getId(),
                ride.getRideNumber(),
                ride.getRider().getId(),
                ride.getRider().getRiderCode(),
                formatRiderName(ride),
                ride.getOrganization() == null ? null : ride.getOrganization().getId(),
                ride.getOrganization() == null ? null : ride.getOrganization().getName(),
                ride.getServiceType(),
                ride.getStatus(),
                ride.getScheduledPickupAt(),
                ride.getScheduledDropoffAt(),
                formatAddress(ride.getPickupAddressLine1(), ride.getPickupCity(), ride.getPickupState()),
                formatAddress(ride.getDropoffAddressLine1(), ride.getDropoffCity(), ride.getDropoffState()),
                driver == null ? null : driver.getId(),
                driver == null ? null : driver.getDriverCode(),
                driver == null ? null : formatDriverName(driver),
                vehicle == null ? null : vehicle.getId(),
                vehicle == null ? null : vehicle.getVehicleCode(),
                vehicle == null ? null : formatVehicle(vehicle),
                ride.getRouteId(),
                warnings.complianceWarning(),
                warnings.conflictWarning(),
                warnings.warningMessages(),
                ride.getUpdatedAt());
    }

    public DispatchRideMapResponse toMapResponse(Ride ride,
            Driver driver,
            Vehicle vehicle,
            DriverLocationSnapshot snapshot) {
        return new DispatchRideMapResponse(
                ride.getId(),
                ride.getRideNumber(),
                formatRiderName(ride),
                driver == null ? null : formatDriverName(driver),
                vehicle == null ? null : formatVehicle(vehicle),
                ride.getServiceType(),
                ride.getStatus(),
                formatAddress(ride.getPickupAddressLine1(), ride.getPickupCity(), ride.getPickupState()),
                formatAddress(ride.getDropoffAddressLine1(), ride.getDropoffCity(), ride.getDropoffState()),
                ride.getScheduledPickupAt(),
                snapshot.getLatitude(),
                snapshot.getLongitude(),
                snapshot.getAccuracyMeters(),
                snapshot.getSpeedMps(),
                snapshot.getHeadingDegrees(),
                snapshot.getCapturedAt());
    }

    private String formatRiderName(Ride ride) {
        return ((ride.getRider().getFirstName() == null ? "" : ride.getRider().getFirstName().trim()) + " "
                + (ride.getRider().getLastName() == null ? "" : ride.getRider().getLastName().trim())).trim();
    }

    private String formatDriverName(Driver driver) {
        return ((driver.getFirstName() == null ? "" : driver.getFirstName().trim()) + " "
                + (driver.getLastName() == null ? "" : driver.getLastName().trim())).trim();
    }

    private String formatVehicle(Vehicle vehicle) {
        return (vehicle.getPlateNumber() == null || vehicle.getPlateNumber().isBlank())
                ? vehicle.getMake() + " " + vehicle.getModel()
                : vehicle.getPlateNumber() + " - " + vehicle.getMake() + " " + vehicle.getModel();
    }

    private String formatAddress(String line1, String city, String state) {
        return ((line1 == null ? "" : line1.trim()) + ", "
                + (city == null ? "" : city.trim()) + ", "
                + (state == null ? "" : state.trim())).trim();
    }
}
