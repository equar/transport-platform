package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import com.transportplatform.tms.features.portalaccess.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.rider.domain.*;
import java.util.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class NotificationEventServiceTest {
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "Suite 2"})
    void enRouteNotificationsAllowOptionalAddressFields(String line2) {
        var dispatch = mock(NotificationDispatchService.class);
        var users = mock(AppUserRepository.class);
        var scopes = mock(PortalUserScopeRepository.class);
        var service = new NotificationEventService(dispatch, mock(NotificationEmailSender.class),
                users, scopes, mock(RiderGuardianRepository.class),
                mock(com.transportplatform.tms.features.companyapplication.application.TenantEmailVerificationService.class));
        var user = new AppUser();
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 7L); user.setTenantId("tenant-a"); user.setStatus(UserStatus.ACTIVE);
        user.setEnabled(true); user.setEmail("qa@bakaroo.com");
        var scope = new PortalUserScope(); scope.setAppUserId(7L); scope.setPortalSubjectId(12L);
        when(scopes.findAllByTenantIdAndPortalSubjectType("tenant-a", PortalSubjectType.RIDER))
                .thenReturn(List.of(scope));
        when(users.findById(7L)).thenReturn(Optional.of(user));
        var rider = mock(Rider.class); when(rider.getId()).thenReturn(12L);
        var ride = new Ride(); org.springframework.test.util.ReflectionTestUtils.setField(ride, "id", 22L); ride.setTenantId("tenant-a");
        ride.setRideNumber("QA-R22"); ride.setStatus(RideStatus.DRIVER_EN_ROUTE); ride.setRider(rider);
        ride.setPickupAddressLine1(" 309 Willow Court "); ride.setPickupAddressLine2(line2);
        ride.setPickupCity("Boston"); ride.setPickupState("MA"); ride.setPickupZipCode("02110");
        // Even a legacy record with all destination components absent must not break status updates.
        doAnswer(invocation -> {
            Map<String, Object> metadata = invocation.getArgument(7);
            String expected = "309 Willow Court, " + (line2 == null || line2.isBlank() ? "" : "Suite 2, ")
                    + "Boston, MA, 02110";
            assertEquals(expected, metadata.get("pickupAddress"));
            assertNull(metadata.get("dropoffAddress"));
            assertEquals("DRIVER_EN_ROUTE", metadata.get("currentStatus"));
            return null;
        }).when(dispatch).notifyInApp(eq("tenant-a"), eq(7L), eq(NotificationType.RIDE_DRIVER_EN_ROUTE),
                eq("RIDE"), eq("22"), anyString(), anyString(), anyMap());

        assertDoesNotThrow(() -> service.publishRideStatusChanged(ride, RideStatus.ASSIGNED, RideStatus.DRIVER_EN_ROUTE));
        verify(dispatch).notifyInApp(eq("tenant-a"), eq(7L), eq(NotificationType.RIDE_DRIVER_EN_ROUTE),
                eq("RIDE"), eq("22"), anyString(), anyString(), anyMap());
    }
}
