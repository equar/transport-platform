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