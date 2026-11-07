package com.transportplatform.tms.features.driverportal.api.response;
import com.transportplatform.tms.features.vehicle.domain.*;
import java.time.LocalDate;
public record DriverPortalVehicleResponse(Long id,String vehicleCode,VehicleOwnershipType ownershipType,
        boolean ownedByCurrentDriver,boolean assignedToCurrentDriver,String make,String model,Integer year,
        String color,String plateNumber,String plateState,Integer capacity,Integer wheelchairCapacity,
        VehicleFuelType fuelType,VehicleStatus status,LocalDate insuranceExpiryDate,
        LocalDate registrationExpiryDate,LocalDate inspectionExpiryDate) {}
