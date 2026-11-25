package com.transportplatform.tms.features.route.application;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import com.transportplatform.tms.features.route.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.billing.application.RouteInvoiceService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
class AutomaticRouteCompletionServiceTest {
    @Test void finalTripCompletesAndInvoicesOnceWhileUnfinishedManifestWaits() {
        var stops=mock(RouteStopRepository.class);var routes=mock(RouteRepository.class);var invoices=mock(RouteInvoiceService.class);
        var service=new AutomaticRouteCompletionService(stops,routes,invoices,mock(AuditLogService.class));
        var route=new Route();route.setTenantId("tenant");route.setStatus(RouteStatus.IN_PROGRESS);ReflectionTestUtils.setField(route,"id",1L);
        var ride=new Ride();ride.setTenantId("tenant");ride.setStatus(RideStatus.COMPLETED);ReflectionTestUtils.setField(ride,"id",2L);
        var other=new Ride();other.setStatus(RideStatus.PICKED_UP);
        var first=new RouteStop();first.setRoute(route);first.setRide(ride);var second=new RouteStop();second.setRoute(route);second.setRide(other);
        when(stops.findAllByTenantIdAndRide_Id("tenant",2L)).thenReturn(List.of(first));when(routes.findByIdAndTenantId(1L,"tenant")).thenReturn(Optional.of(route));when(stops.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc("tenant",1L)).thenReturn(List.of(first,second));
        service.afterTripChanged(ride);verifyNoInteractions(invoices);assertEquals(RouteStatus.IN_PROGRESS,route.getStatus());
        other.setStatus(RideStatus.FAILED);service.afterTripChanged(ride);service.afterTripChanged(ride);
        assertEquals(RouteStatus.COMPLETED,route.getStatus());verify(invoices,times(1)).createDraftOnCompletion(route);verify(routes,times(1)).save(route);
    }
}
