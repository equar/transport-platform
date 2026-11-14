package com.transportplatform.tms.features.driverearnings.api.response;

import java.math.BigDecimal;
import java.time.Instant;

public record DriverEarningsEntryResponse(
        Long id,
        Long driverId,
        String driverName,
        Long rideId,
        String rideNumber,
        String entryType,
        String status,
        BigDecimal amount,
        String currency,
        BigDecimal billableAmount,
        BigDecimal earningsRate,
        String reason,
        Instant createdAt) {
}
