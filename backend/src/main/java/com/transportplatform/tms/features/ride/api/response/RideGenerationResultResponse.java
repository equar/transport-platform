package com.transportplatform.tms.features.ride.api.response;

public record RideGenerationResultResponse(
        int createdCount,
        int duplicateCount,
        int skippedCount,
        String summary) {
}