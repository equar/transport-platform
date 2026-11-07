package com.transportplatform.tms.features.rideevent.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.rideevent.domain.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class PortalRideEventTest {
    @Test void authorizedPortalActorCanWriteCreationAuditWithoutStaffPrivileges() {
        for (String role : List.of("ROLE_RIDER", "ROLE_GUARDIAN")) {
            RideEventRepository events = mock(RideEventRepository.class);
            RideAccessService company = mock(RideAccessService.class);
            CurrentAuthenticatedUserService current = mock(CurrentAuthenticatedUserService.class);
            when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(7L, "tenant", "passenger@example.com",
                    "Passenger", "User", "", true, true, false, List.of(new SimpleGrantedAuthority(role))));
            Ride ride = new Ride(); ride.setTenantId("tenant"); ride.setStatus(RideStatus.REQUESTED);
            new RideEventService(events, company, current).recordRideCreated(ride, "Portal booking");
            ArgumentCaptor<RideEvent> event = ArgumentCaptor.forClass(RideEvent.class);
            verify(events).save(event.capture());
            assertEquals(7L, event.getValue().getActorUserId());
            assertEquals(RideEventType.RIDE_CREATED, event.getValue().getEventType());
            verifyNoInteractions(company);
        }
    }
    @Test void eventWriterRejectsCrossTenantActor() {
        RideEventRepository events = mock(RideEventRepository.class);
        CurrentAuthenticatedUserService current = mock(CurrentAuthenticatedUserService.class);
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(7L, "other", "user@example.com",
                "User", "", "", true, true, false, List.of()));
        Ride ride = new Ride(); ride.setTenantId("tenant");
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> new RideEventService(events, mock(RideAccessService.class), current).recordRideCreated(ride, "Denied"));
        verifyNoInteractions(events);
    }
}
