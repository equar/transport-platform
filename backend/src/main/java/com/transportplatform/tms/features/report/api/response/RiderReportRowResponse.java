package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import java.time.Instant;

public record RiderReportRowResponse(
        Long id,
        String riderCode,
        String riderName,
        RiderStatus status,
        RiderType riderType,
        Long organizationId,
        boolean wheelchairRequired,
        boolean escortRequired,
        Instant createdAt) {
}