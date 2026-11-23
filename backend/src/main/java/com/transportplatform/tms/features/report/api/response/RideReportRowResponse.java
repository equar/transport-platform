package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.time.LocalDateTime;

public record RideReportRowResponse(
        Long id,
        String rideNumber,
        RideStatus status,
        ServiceType serviceType,
        RideTripType tripType,
        LocalDateTime scheduledPickupAt,
        String riderCode,
        String riderName,
        String driverCode,
        String vehicleCode,
        String organizationName,
        LocalDateTime scheduledDropoffAt,
        java.time.Instant actualPickupAt,
        java.time.Instant actualDropoffAt,
        Long pickupDelayMinutes,
        Long dropoffDelayMinutes,
        java.math.BigDecimal passengerMiles,
        Long passengerMinutes,
        String cancellationReason) {
}