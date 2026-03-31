package com.transportplatform.tms.features.driver.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import org.junit.jupiter.api.Test;

class DriverStatusWorkflowTest {

    @Test
    void reviewRejectsActiveDriver() {
        ApiException exception = assertThrows(ApiException.class,
                () -> DriverStatusWorkflow.ensureCanReview(DriverStatus.ACTIVE));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void activateRequiresCompletedTraining() {
        Driver driver = new Driver();
        driver.setStatus(DriverStatus.TRAINING_PENDING);
        driver.setTrainingStatus(DriverTrainingStatus.IN_PROGRESS);

        ApiException exception = assertThrows(ApiException.class,
                () -> DriverStatusWorkflow.ensureCanActivate(driver));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void activateAllowsCompletedTrainingFromTrainingPending() {
        Driver driver = new Driver();
        driver.setStatus(DriverStatus.TRAINING_PENDING);
        driver.setTrainingStatus(DriverTrainingStatus.COMPLETED);

        assertDoesNotThrow(() -> DriverStatusWorkflow.ensureCanActivate(driver));
    }
}