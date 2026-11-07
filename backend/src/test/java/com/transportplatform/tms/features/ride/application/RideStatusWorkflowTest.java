package com.transportplatform.tms.features.ride.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import org.junit.jupiter.api.Test;

class RideStatusWorkflowTest {

    @Test
    void resolveInitialStatusRejectsCancelledCreation() {
        ApiException exception = assertThrows(ApiException.class,
                () -> RideStatusWorkflow.resolveInitialStatus(RideStatus.CANCELLED));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void scheduleAllowsPendingReviewRide() {
        assertDoesNotThrow(() -> RideStatusWorkflow.ensureCanSchedule(RideStatus.PENDING_REVIEW));
    }

    @Test
    void cancelRejectsCompletedRide() {
        ApiException exception = assertThrows(ApiException.class,
                () -> RideStatusWorkflow.ensureCanCancel(RideStatus.COMPLETED));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }
    @Test
    void cancellationAndEditingRejectAllDepartedAndTerminalStates() {
        for (RideStatus status : RideStatus.values()) {
            boolean preDeparture = java.util.Set.of(RideStatus.DRAFT, RideStatus.REQUESTED,
                    RideStatus.PENDING_REVIEW, RideStatus.SCHEDULED, RideStatus.ASSIGNED).contains(status);
            if (preDeparture) {
                assertDoesNotThrow(() -> RideStatusWorkflow.ensureCanCancel(status));
                assertDoesNotThrow(() -> RideStatusWorkflow.ensureCanEdit(status));
            } else {
                assertThrows(ApiException.class, () -> RideStatusWorkflow.ensureCanCancel(status), status.name());
                assertThrows(ApiException.class, () -> RideStatusWorkflow.ensureCanEdit(status), status.name());
            }
        }
    }

    @Test
    void noShowRequiresRecordedArrival() {
        for (RideStatus status : RideStatus.values()) {
            if (status == RideStatus.ARRIVED) assertDoesNotThrow(() -> RideStatusWorkflow.ensureCanMarkNoShow(status));
            else assertThrows(ApiException.class, () -> RideStatusWorkflow.ensureCanMarkNoShow(status), status.name());
        }
    }
}