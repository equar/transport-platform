package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import org.springframework.http.HttpStatus;

public final class VehicleStatusWorkflow {

    private VehicleStatusWorkflow() {
    }

    public static void ensureCanActivate(Vehicle vehicle) {
        VehicleStatus currentStatus = vehicle.getStatus();
        if (currentStatus != VehicleStatus.INACTIVE
                && currentStatus != VehicleStatus.MAINTENANCE
                && currentStatus != VehicleStatus.OUT_OF_SERVICE
                && currentStatus != VehicleStatus.SUSPENDED) {
            throw invalidTransition(
                    "Only inactive, maintenance, out-of-service, or suspended vehicles can be activated.");
        }
    }

    public static void ensureCanSuspend(VehicleStatus currentStatus) {
        if (currentStatus != VehicleStatus.ACTIVE) {
            throw invalidTransition("Only active vehicles can be suspended.");
        }
    }

    public static void ensureCanMarkMaintenance(VehicleStatus currentStatus) {
        if (currentStatus != VehicleStatus.ACTIVE) {
            throw invalidTransition("Only active vehicles can be moved into maintenance.");
        }
    }

    public static void ensureCanMarkOutOfService(VehicleStatus currentStatus) {
        if (currentStatus != VehicleStatus.ACTIVE && currentStatus != VehicleStatus.MAINTENANCE) {
            throw invalidTransition("Only active or maintenance vehicles can be marked out of service.");
        }
    }

    public static void ensureCanDeactivate(VehicleStatus currentStatus) {
        if (currentStatus == VehicleStatus.INACTIVE) {
            throw invalidTransition("Vehicle is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}