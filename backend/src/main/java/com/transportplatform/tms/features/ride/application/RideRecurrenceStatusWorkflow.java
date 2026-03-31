package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import org.springframework.http.HttpStatus;

public final class RideRecurrenceStatusWorkflow {

    private RideRecurrenceStatusWorkflow() {
    }

    public static RideRecurrenceStatus resolveInitialStatus(RideRecurrenceStatus requestedStatus) {
        if (requestedStatus == null) {
            return RideRecurrenceStatus.DRAFT;
        }
        if (requestedStatus == RideRecurrenceStatus.DRAFT || requestedStatus == RideRecurrenceStatus.ACTIVE) {
            return requestedStatus;
        }
        throw invalidTransition("Recurring ride schedules can only be created as draft or active.");
    }

    public static void ensureCanEdit(RideRecurrenceStatus currentStatus) {
        if (currentStatus == RideRecurrenceStatus.INACTIVE || currentStatus == RideRecurrenceStatus.COMPLETED) {
            throw invalidTransition("Inactive or completed recurring schedules cannot be edited.");
        }
    }

    public static void ensureCanActivate(RideRecurrenceStatus currentStatus) {
        if (currentStatus != RideRecurrenceStatus.DRAFT && currentStatus != RideRecurrenceStatus.PAUSED) {
            throw invalidTransition("Only draft or paused recurring schedules can be activated.");
        }
    }

    public static void ensureCanPause(RideRecurrenceStatus currentStatus) {
        if (currentStatus != RideRecurrenceStatus.ACTIVE) {
            throw invalidTransition("Only active recurring schedules can be paused.");
        }
    }

    public static void ensureCanDeactivate(RideRecurrenceStatus currentStatus) {
        if (currentStatus == RideRecurrenceStatus.INACTIVE || currentStatus == RideRecurrenceStatus.COMPLETED) {
            throw invalidTransition("This recurring schedule can no longer be deactivated.");
        }
    }

    public static void ensureCanGenerate(RideRecurrenceStatus currentStatus) {
        if (currentStatus == RideRecurrenceStatus.INACTIVE || currentStatus == RideRecurrenceStatus.COMPLETED) {
            throw invalidTransition("Inactive or completed recurring schedules cannot generate rides.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}