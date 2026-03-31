package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import java.time.Instant;
import java.time.LocalDate;

public record DriverReportRowResponse(
        Long id,
        String driverCode,
        String driverName,
        DriverStatus status,
        DriverType driverType,
        String phone,
        String email,
        LocalDate licenseExpiryDate,
        DriverTrainingStatus trainingStatus,
        Instant createdAt) {
}