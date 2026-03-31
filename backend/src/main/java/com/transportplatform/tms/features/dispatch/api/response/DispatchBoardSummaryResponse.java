package com.transportplatform.tms.features.dispatch.api.response;

public record DispatchBoardSummaryResponse(
        long scheduledCount,
        long assignedCount,
        long inProgressCount,
        long exceptionCount,
        long completedTodayCount,
        long noShowTodayCount) {
}