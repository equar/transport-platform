package com.transportplatform.tms.features.rider.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import org.junit.jupiter.api.Test;

class RiderStatusWorkflowTest {

    @Test
    void waitlistRejectsInactiveRider() {
        ApiException exception = assertThrows(ApiException.class,
                () -> RiderStatusWorkflow.ensureCanWaitlist(RiderStatus.INACTIVE));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void activateAllowsWaitlistedRider() {
        assertDoesNotThrow(() -> RiderStatusWorkflow.ensureCanActivate(RiderStatus.WAITLISTED));
    }
}