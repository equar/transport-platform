package com.transportplatform.tms.features.vehicle.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import org.junit.jupiter.api.Test;

class VehicleStatusWorkflowTest {

    @Test
    void maintenanceRejectsInactiveVehicle() {
        ApiException exception = assertThrows(ApiException.class,
                () -> VehicleStatusWorkflow.ensureCanMarkMaintenance(VehicleStatus.INACTIVE));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void activateAllowsSuspendedVehicle() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(VehicleStatus.SUSPENDED);

        assertDoesNotThrow(() -> VehicleStatusWorkflow.ensureCanActivate(vehicle));
    }
}