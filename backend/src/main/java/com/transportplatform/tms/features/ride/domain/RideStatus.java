package com.transportplatform.tms.features.ride.domain;

public enum RideStatus {
    DRAFT,
    REQUESTED,
    PENDING_REVIEW,
    SCHEDULED,
    ASSIGNED,
    DRIVER_EN_ROUTE,
    ARRIVED,
    RIDER_NO_SHOW,
    PICKED_UP,
    DROPPED_OFF,
    COMPLETED,
    CANCELLED,
    MISSED,
    FAILED
}