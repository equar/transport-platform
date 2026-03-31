package com.transportplatform.tms.features.rider.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import org.junit.jupiter.api.Test;

class GuardianStatusWorkflowTest {

    @Test
    void suspendRejectsInactiveGuardian() {
        ApiException exception = assertThrows(ApiException.class,
                () -> GuardianStatusWorkflow.ensureCanSuspend(GuardianStatus.INACTIVE));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void activateAllowsSuspendedGuardian() {
        assertDoesNotThrow(() -> GuardianStatusWorkflow.ensureCanActivate(GuardianStatus.SUSPENDED));
    }
}