package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import org.springframework.http.HttpStatus;

public final class RouteStatusWorkflow {

    private RouteStatusWorkflow() {
    }

    public static RouteStatus resolveInitialStatus(RouteStatus requestedStatus) {
        if (requestedStatus == null) {
            return RouteStatus.DRAFT;
        }
        if (requestedStatus == RouteStatus.DRAFT || requestedStatus == RouteStatus.PLANNED) {
            return requestedStatus;
        }
        throw invalidTransition("Routes can only be created as draft or planned.");
    }

    public static void ensureCanEdit(RouteStatus currentStatus) {
        if (currentStatus == RouteStatus.IN_PROGRESS
                || currentStatus == RouteStatus.COMPLETED
                || currentStatus == RouteStatus.CANCELLED) {
            throw invalidTransition("In-progress, completed, or cancelled routes cannot be edited.");
        }
    }

    public static void ensureCanMarkReady(RouteStatus currentStatus) {
        if (currentStatus != RouteStatus.DRAFT && currentStatus != RouteStatus.PLANNED) {
            throw invalidTransition("Only draft or planned routes can be marked ready.");
        }
    }

    public static void ensureCanStart(RouteStatus currentStatus) {
        if (currentStatus != RouteStatus.READY) {
            throw invalidTransition("Only ready routes can be started.");
        }
    }

    public static void ensureCanComplete(RouteStatus currentStatus) {
        if (currentStatus != RouteStatus.IN_PROGRESS) {
            throw invalidTransition("Only in-progress routes can be completed.");
        }
    }

    public static void ensureCanCancel(RouteStatus currentStatus) {
        if (currentStatus == RouteStatus.COMPLETED || currentStatus == RouteStatus.CANCELLED) {
            throw invalidTransition("Completed or cancelled routes cannot be cancelled again.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}