package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import org.springframework.http.HttpStatus;

public final class RideStatusWorkflow {

    private RideStatusWorkflow() {
    }

    public static RideStatus resolveInitialStatus(RideStatus requestedStatus) {
        if (requestedStatus == null) {
            return RideStatus.REQUESTED;
        }
        if (requestedStatus == RideStatus.DRAFT
                || requestedStatus == RideStatus.REQUESTED
                || requestedStatus == RideStatus.PENDING_REVIEW
                || requestedStatus == RideStatus.SCHEDULED) {
            return requestedStatus;
        }
        throw invalidTransition("Rides can only be created as draft, requested, pending review, or scheduled.");
    }

    public static void ensureCanEdit(RideStatus currentStatus) {
        if (currentStatus == RideStatus.CANCELLED
                || currentStatus == RideStatus.COMPLETED
                || currentStatus == RideStatus.DROPPED_OFF) {
            throw invalidTransition("Completed or cancelled rides cannot be edited.");
        }
    }

    public static void ensureCanRequest(RideStatus currentStatus) {
        if (currentStatus != RideStatus.DRAFT) {
            throw invalidTransition("Only draft rides can be moved to requested.");
        }
    }

    public static void ensureCanReview(RideStatus currentStatus) {
        if (currentStatus != RideStatus.DRAFT && currentStatus != RideStatus.REQUESTED) {
            throw invalidTransition("Only draft or requested rides can be moved into review.");
        }
    }

    public static void ensureCanSchedule(RideStatus currentStatus) {
        if (currentStatus != RideStatus.DRAFT
                && currentStatus != RideStatus.REQUESTED
                && currentStatus != RideStatus.PENDING_REVIEW) {
            throw invalidTransition("Only draft, requested, or pending review rides can be scheduled.");
        }
    }

    public static void ensureCanAssignResources(RideStatus currentStatus) {
        if (currentStatus != RideStatus.SCHEDULED && currentStatus != RideStatus.ASSIGNED) {
            throw invalidTransition("Only scheduled or assigned rides can update dispatch resources.");
        }
    }

    public static void ensureCanUnassignResources(RideStatus currentStatus) {
        if (currentStatus != RideStatus.SCHEDULED && currentStatus != RideStatus.ASSIGNED) {
            throw invalidTransition("Only scheduled or assigned rides can remove dispatch resources.");
        }
    }

    public static void ensureCanMarkAssigned(RideStatus currentStatus) {
        if (currentStatus != RideStatus.SCHEDULED) {
            throw invalidTransition("Only scheduled rides can move to assigned.");
        }
    }

    public static void ensureCanMarkDriverEnRoute(RideStatus currentStatus) {
        if (currentStatus != RideStatus.ASSIGNED) {
            throw invalidTransition("Only assigned rides can be marked as driver en route.");
        }
    }

    public static void ensureCanMarkArrived(RideStatus currentStatus) {
        if (currentStatus != RideStatus.DRIVER_EN_ROUTE) {
            throw invalidTransition("Only rides with driver en route can be marked as arrived.");
        }
    }

    public static void ensureCanMarkPickedUp(RideStatus currentStatus) {
        if (currentStatus != RideStatus.ARRIVED) {
            throw invalidTransition("Only arrived rides can be marked as picked up.");
        }
    }

    public static void ensureCanMarkDroppedOff(RideStatus currentStatus) {
        if (currentStatus != RideStatus.PICKED_UP) {
            throw invalidTransition("Only picked up rides can be marked as dropped off.");
        }
    }

    public static void ensureCanMarkCompleted(RideStatus currentStatus) {
        if (currentStatus != RideStatus.DROPPED_OFF) {
            throw invalidTransition("Only dropped off rides can be marked as completed.");
        }
    }

    public static void ensureCanMarkNoShow(RideStatus currentStatus) {
        if (currentStatus != RideStatus.ASSIGNED && currentStatus != RideStatus.ARRIVED) {
            throw invalidTransition("Only assigned or arrived rides can be marked as rider no show.");
        }
    }

    public static void ensureCanMarkMissed(RideStatus currentStatus) {
        if (currentStatus != RideStatus.SCHEDULED && currentStatus != RideStatus.ASSIGNED) {
            throw invalidTransition("Only scheduled or assigned rides can be marked as missed.");
        }
    }

    public static void ensureCanMarkFailed(RideStatus currentStatus) {
        if (currentStatus != RideStatus.ASSIGNED
                && currentStatus != RideStatus.DRIVER_EN_ROUTE
                && currentStatus != RideStatus.ARRIVED
                && currentStatus != RideStatus.PICKED_UP
                && currentStatus != RideStatus.DROPPED_OFF) {
            throw invalidTransition("Only active operational rides can be marked as failed.");
        }
    }

    public static void ensureCanCancel(RideStatus currentStatus) {
        if (currentStatus == RideStatus.CANCELLED || currentStatus == RideStatus.COMPLETED) {
            throw invalidTransition("This ride can no longer be cancelled.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}