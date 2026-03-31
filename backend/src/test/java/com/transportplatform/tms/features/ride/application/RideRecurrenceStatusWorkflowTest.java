package com.transportplatform.tms.features.ride.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import org.junit.jupiter.api.Test;

class RideRecurrenceStatusWorkflowTest {

    @Test
    void resolveInitialStatusRejectsPausedCreation() {
        ApiException exception = assertThrows(ApiException.class,
                () -> RideRecurrenceStatusWorkflow.resolveInitialStatus(RideRecurrenceStatus.PAUSED));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void activateAllowsPausedSchedule() {
        assertDoesNotThrow(() -> RideRecurrenceStatusWorkflow.ensureCanActivate(RideRecurrenceStatus.PAUSED));
    }

    @Test
    void generateRejectsInactiveSchedule() {
        ApiException exception = assertThrows(ApiException.class,
                () -> RideRecurrenceStatusWorkflow.ensureCanGenerate(RideRecurrenceStatus.INACTIVE));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }
}