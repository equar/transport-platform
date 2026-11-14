package com.transportplatform.tms.features.driverearnings.api.response;
import java.math.BigDecimal; import java.time.Instant;
public record DriverEarningsEntryResponse(Long id, Long driverId, Long rideId, String entryType, String status, BigDecimal amount, String currency, BigDecimal invoiceTotal, BigDecimal earningsRate, String reason, Instant createdAt) {}
