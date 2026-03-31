package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import org.springframework.http.HttpStatus;

public final class DriverStatusWorkflow {

    private DriverStatusWorkflow() {
    }

    public static void ensureCanReview(DriverStatus currentStatus) {
        if (currentStatus != DriverStatus.APPLIED && currentStatus != DriverStatus.PENDING_REVIEW) {
            throw invalidTransition("Only applied or pending-review drivers can move into document collection.");
        }
    }

    public static void ensureCanCompleteDocuments(DriverStatus currentStatus) {
        if (currentStatus != DriverStatus.DOCUMENT_PENDING) {
            throw invalidTransition("Only document-pending drivers can complete document collection.");
        }
    }

    public static DriverStatus resolvePostDocumentStatus(Driver driver) {
        if (driver.getTrainingStatus() == DriverTrainingStatus.COMPLETED) {
            return DriverStatus.ACTIVE;
        }
        return DriverStatus.TRAINING_PENDING;
    }

    public static void ensureCanActivate(Driver driver) {
        DriverStatus currentStatus = driver.getStatus();
        if (currentStatus != DriverStatus.TRAINING_PENDING
                && currentStatus != DriverStatus.SUSPENDED
                && currentStatus != DriverStatus.INACTIVE) {
            throw invalidTransition("Only training-pending, suspended, or inactive drivers can be activated.");
        }
        if (driver.getTrainingStatus() != DriverTrainingStatus.COMPLETED) {
            throw invalidTransition("Driver training must be completed before activation.");
        }
    }

    public static void ensureCanSuspend(DriverStatus currentStatus) {
        if (currentStatus == DriverStatus.SUSPENDED
                || currentStatus == DriverStatus.INACTIVE
                || currentStatus == DriverStatus.TERMINATED) {
            throw invalidTransition("The selected driver cannot be suspended from the current status.");
        }
    }

    public static void ensureCanDeactivate(DriverStatus currentStatus) {
        if (currentStatus == DriverStatus.INACTIVE || currentStatus == DriverStatus.TERMINATED) {
            throw invalidTransition("The selected driver cannot be marked inactive from the current status.");
        }
    }

    public static void ensureCanTerminate(DriverStatus currentStatus) {
        if (currentStatus == DriverStatus.TERMINATED) {
            throw invalidTransition("Driver is already terminated.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}