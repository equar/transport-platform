package com.transportplatform.tms.features.rideevent.application;

import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.rideevent.api.response.RideEventResponse;
import com.transportplatform.tms.features.rideevent.domain.RideEvent;
import com.transportplatform.tms.features.rideevent.domain.RideEventRepository;
import com.transportplatform.tms.features.rideevent.domain.RideEventType;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RideEventService {

    private final RideEventRepository rideEventRepository;
    private final RideAccessService rideAccessService;

    public RideEventService(RideEventRepository rideEventRepository, RideAccessService rideAccessService) {
        this.rideEventRepository = rideEventRepository;
        this.rideAccessService = rideAccessService;
    }

    @Transactional(readOnly = true)
    public List<RideEventResponse> getCompanyRideEvents(Long rideId) {
        Ride ride = rideAccessService.findRideForCompanyScope(rideId);
        return rideEventRepository.findAllByTenantIdAndRide_IdOrderByCreatedAtAsc(ride.getTenantId(), ride.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void recordRideCreated(Ride ride, String notes) {
        persistEvent(ride, RideEventType.RIDE_CREATED, null, ride.getStatus(), notes);
    }

    @Transactional
    public void recordStatusChanged(Ride ride, RideStatus previousStatus, RideStatus newStatus, String notes) {
        persistEvent(ride, resolveStatusEventType(newStatus), previousStatus, newStatus, notes);
    }

    @Transactional
    public void recordDriverAssigned(Ride ride, String driverLabel, String notes) {
        persistEvent(ride, RideEventType.DRIVER_ASSIGNED, ride.getStatus(), ride.getStatus(),
                mergeNotes(notes, driverLabel == null ? null : "Driver assigned: " + driverLabel));
    }

    @Transactional
    public void recordDriverUnassigned(Ride ride, String driverLabel, String notes) {
        persistEvent(ride, RideEventType.DRIVER_UNASSIGNED, ride.getStatus(), ride.getStatus(),
                mergeNotes(notes, driverLabel == null ? null : "Driver removed: " + driverLabel));
    }

    @Transactional
    public void recordVehicleAssigned(Ride ride, String vehicleLabel, String notes) {
        persistEvent(ride, RideEventType.VEHICLE_ASSIGNED, ride.getStatus(), ride.getStatus(),
                mergeNotes(notes, vehicleLabel == null ? null : "Vehicle assigned: " + vehicleLabel));
    }

    @Transactional
    public void recordVehicleUnassigned(Ride ride, String vehicleLabel, String notes) {
        persistEvent(ride, RideEventType.VEHICLE_UNASSIGNED, ride.getStatus(), ride.getStatus(),
                mergeNotes(notes, vehicleLabel == null ? null : "Vehicle removed: " + vehicleLabel));
    }

    @Transactional
    public void recordRouteAssigned(Ride ride, String routeCode, String notes) {
        persistEvent(ride, RideEventType.ROUTE_ASSIGNED, ride.getStatus(), ride.getStatus(),
                mergeNotes(notes, routeCode == null ? null : "Assigned to route " + routeCode + "."));
    }

    @Transactional
    public void recordRouteUnassigned(Ride ride, String routeCode, String notes) {
        persistEvent(ride, RideEventType.ROUTE_UNASSIGNED, ride.getStatus(), ride.getStatus(),
                mergeNotes(notes, routeCode == null ? null : "Removed from route " + routeCode + "."));
    }

    @Transactional
    public void recordNote(Ride ride, String notes) {
        persistEvent(ride, RideEventType.NOTE_ADDED, ride.getStatus(), ride.getStatus(), notes);
    }

    private void persistEvent(Ride ride,
            RideEventType eventType,
            RideStatus previousStatus,
            RideStatus newStatus,
            String notes) {
        AuthenticatedUser actor = rideAccessService.requireCompanyUser();
        RideEvent rideEvent = new RideEvent();
        rideEvent.setTenantId(ride.getTenantId());
        rideEvent.setRide(ride);
        rideEvent.setEventType(eventType);
        rideEvent.setActorUserId(actor.id());
        rideEvent.setActorName(actor.displayName());
        rideEvent.setActorEmail(actor.username());
        rideEvent.setPreviousStatus(previousStatus);
        rideEvent.setNewStatus(newStatus);
        rideEvent.setNotes(trimToNull(notes));
        rideEventRepository.save(rideEvent);
    }

    private RideEventType resolveStatusEventType(RideStatus status) {
        return switch (status) {
            case DRIVER_EN_ROUTE -> RideEventType.DRIVER_EN_ROUTE;
            case ARRIVED -> RideEventType.ARRIVED;
            case PICKED_UP -> RideEventType.PICKED_UP;
            case DROPPED_OFF -> RideEventType.DROPPED_OFF;
            case COMPLETED -> RideEventType.COMPLETED;
            case CANCELLED -> RideEventType.CANCELLED;
            case RIDER_NO_SHOW -> RideEventType.NO_SHOW;
            case MISSED -> RideEventType.MISSED;
            case FAILED -> RideEventType.FAILED;
            default -> RideEventType.STATUS_CHANGED;
        };
    }

    private RideEventResponse toResponse(RideEvent rideEvent) {
        return new RideEventResponse(
                rideEvent.getId(),
                rideEvent.getRide().getId(),
                rideEvent.getEventType(),
                rideEvent.getActorUserId(),
                rideEvent.getActorName(),
                rideEvent.getActorEmail(),
                rideEvent.getPreviousStatus(),
                rideEvent.getNewStatus(),
                rideEvent.getNotes(),
                rideEvent.getCreatedAt());
    }

    private String mergeNotes(String baseNotes, String appendedNote) {
        String base = trimToNull(baseNotes);
        String extra = trimToNull(appendedNote);
        if (base == null) {
            return extra;
        }
        if (extra == null) {
            return base;
        }
        return base + " " + extra;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}