package com.transportplatform.tms.features.route.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import java.util.List;
import org.junit.jupiter.api.Test;

class RouteStatusWorkflowTest {

    @Test
    void inProgressRouteCannotBeCancelled() {
        assertThrows(ApiException.class, () -> RouteStatusWorkflow.ensureCanCancel(RouteStatus.IN_PROGRESS));
    }

    @Test
    void routeCannotCompleteWhileAnyRideIsUnfinished() {
        assertThrows(ApiException.class,
                () -> RouteStatusWorkflow.ensureRidesFinished(List.of(RideStatus.COMPLETED, RideStatus.ASSIGNED)));
        assertThrows(ApiException.class, () -> RouteStatusWorkflow.ensureRidesFinished(List.of()));
    }

    @Test
    void routeCanCompleteWhenEveryRideIsTerminal() {
        assertDoesNotThrow(() -> RouteStatusWorkflow.ensureRidesFinished(List.of(
                RideStatus.COMPLETED,
                RideStatus.CANCELLED,
                RideStatus.MISSED,
                RideStatus.FAILED,
                RideStatus.RIDER_NO_SHOW)));
    }
}
