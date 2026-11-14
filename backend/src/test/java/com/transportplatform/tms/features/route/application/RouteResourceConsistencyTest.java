package com.transportplatform.tms.features.route.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.dispatch.application.DispatchAssignmentValidationService;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import com.transportplatform.tms.features.route.api.request.AssignRouteResourcesRequest;
import com.transportplatform.tms.features.route.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService;
import com.transportplatform.tms.features.vehicle.domain.*;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class RouteResourceConsistencyTest {
    private final TenantRepository tenants = mock(TenantRepository.class);
    private final DispatchAssignmentValidationService validation = mock(DispatchAssignmentValidationService.class);
    private final RouteRepository routes = mock(RouteRepository.class);
    private final RouteStopRepository stops = mock(RouteStopRepository.class);
    private final RideRepository rides = mock(RideRepository.class);
    private final DriverRepository drivers = mock(DriverRepository.class);
    private final VehicleRepository vehicles = mock(VehicleRepository.class);
    private final RouteAccessService access = mock(RouteAccessService.class);
    private final RideEventService rideEvents = mock(RideEventService.class);
    private final NotificationEventService notifications = mock(NotificationEventService.class);
    private final DriverComplianceSummaryService compliance = mock(DriverComplianceSummaryService.class, RETURNS_DEEP_STUBS);
    private final RouteService service = new RouteService(tenants, validation, routes, stops, rides, drivers,
            vehicles, access, mock(RideAccessService.class), mock(RouteMapper.class), mock(RouteCodeGenerator.class),
            compliance, mock(VehicleComplianceSummaryService.class), rideEvents, mock(AuditLogService.class), notifications);
    private Route route;
    private Ride ride;
    private RouteStop stop;

    @BeforeEach void setup() {
        route = new Route(); ReflectionTestUtils.setField(route, "id", 1L);
        route.setTenantId("tenant"); route.setStatus(RouteStatus.PLANNED); route.setAssignedDriverId(10L);
        ride = new Ride(); ReflectionTestUtils.setField(ride, "id", 2L);
        ride.setTenantId("tenant"); ride.setRouteId(1L); ride.setDriverId(10L); ride.setStatus(RideStatus.ASSIGNED);
        ride.setRideNumber("ride-1");
        stop = new RouteStop(); ReflectionTestUtils.setField(stop, "id", 3L);
        stop.setTenantId("tenant"); stop.setStopSequence(1); stop.setRide(ride); stop.setRoute(route);
        when(access.requireCompanyTenantId()).thenReturn("tenant");
        when(tenants.lockForDispatch("tenant")).thenReturn(Optional.of(new Tenant()));
        when(access.findRouteForCompanyScope(1L)).thenReturn(route);
        when(routes.save(any())).thenAnswer(call -> call.getArgument(0));
        when(stops.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc("tenant", 1L)).thenReturn(List.of(stop));
    }
    @Test void replacementRevokesOldDriverAndUpdatesLinkedRide() {
        Driver replacement = new Driver(); ReflectionTestUtils.setField(replacement, "id", 20L);
        replacement.setStatus(DriverStatus.ACTIVE);
        when(drivers.findByIdAndTenantId(20L, "tenant")).thenReturn(Optional.of(replacement));
        when(compliance.getSummary("tenant", replacement).overallStatus()).thenReturn(DriverComplianceStatus.COMPLIANT);
        service.assignCompanyRouteResources(1L, new AssignRouteResourcesRequest(20L, null));
        assertEquals(20L, route.getAssignedDriverId()); assertEquals(20L, ride.getDriverId());
        verify(validation).requireAssignableDriver("tenant", ride, 20L);
        verify(rides).save(ride);
    }
    @Test void removingDriverAlsoRemovesRideAssignmentAndReturnsToScheduled() {
        service.unassignCompanyRouteDriver(1L);
        assertNull(ride.getDriverId()); assertEquals(RideStatus.SCHEDULED, ride.getStatus());
        verify(rides).save(ride);
    }
    @Test void departedPassengerPreventsAssignmentRemoval() {
        ride.setStatus(RideStatus.PICKED_UP);
        assertThrows(ApiException.class, () -> service.unassignCompanyRouteDriver(1L));
        assertEquals(10L, ride.getDriverId()); verify(rides, never()).save(any());
    }
    @Test void cancellingUnstartedRouteReleasesLinkedRideAndResources() {
        route.setRouteCode("route-1");
        route.setAssignedVehicleId(30L);
        ride.setVehicleId(30L);

        service.cancelCompanyRoute(1L);

        assertEquals(RouteStatus.CANCELLED, route.getStatus());
        assertNull(route.getAssignedDriverId());
        assertNull(route.getAssignedVehicleId());
        assertNull(ride.getRouteId());
        assertNull(ride.getDriverId());
        assertNull(ride.getVehicleId());
        assertEquals(RideStatus.SCHEDULED, ride.getStatus());
        verify(stops).deleteAll(List.of(stop));
        verify(rides).save(ride);
        verify(rideEvents).recordRouteUnassigned(ride, "route-1", null);
        verify(notifications).publishRideStatusChanged(ride, RideStatus.ASSIGNED, RideStatus.SCHEDULED);
    }
    @Test void cannotCompleteRouteWhileLinkedRideIsStillAssigned() {
        route.setStatus(RouteStatus.IN_PROGRESS);

        assertThrows(ApiException.class, () -> service.completeCompanyRoute(1L));

        verify(routes, never()).save(any());
    }
}
