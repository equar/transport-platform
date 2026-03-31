package com.transportplatform.tms.features.rideevent.domain;

public enum RideEventType {
    RIDE_CREATED,
    STATUS_CHANGED,
    DRIVER_ASSIGNED,
    DRIVER_UNASSIGNED,
    VEHICLE_ASSIGNED,
    VEHICLE_UNASSIGNED,
    ROUTE_ASSIGNED,
    ROUTE_UNASSIGNED,
    DRIVER_EN_ROUTE,
    ARRIVED,
    PICKED_UP,
    DROPPED_OFF,
    COMPLETED,
    CANCELLED,
    NO_SHOW,
    MISSED,
    FAILED,
    NOTE_ADDED
}