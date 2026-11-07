package com.transportplatform.tms.features.driverportal.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotency;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotencyRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DriverActionIdempotencyServiceTest {

    @Mock
    private DriverActionIdempotencyRepository repository;

    @Mock
    private CurrentAuthenticatedUserService currentUserService;

    @Test
    void replaysAnIdenticalDriverActionWithoutExecutingItAgain() {
        DriverActionIdempotencyService service = service();
        DriverActionIdempotency record = record(42L, "arrived");
        AtomicBoolean operationCalled = new AtomicBoolean();

        when(currentUserService.requireCurrentUser()).thenReturn(currentUser());
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-123", 7L, "request-123"))
                .thenReturn(Optional.of(record));

        String result = service.execute("request-123", 42L, "arrived", () -> {
            operationCalled.set(true);
            return "operation";
        }, () -> "replayed");

        assertEquals("replayed", result);
        assertEquals(false, operationCalled.get());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAKeyReusedForADifferentDriverAction() {
        DriverActionIdempotencyService service = service();

        when(currentUserService.requireCurrentUser()).thenReturn(currentUser());
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-123", 7L, "request-123"))
                .thenReturn(Optional.of(record(42L, "arrived")));

        ApiException exception = assertThrows(ApiException.class,
                () -> service.execute("request-123", 42L, "picked-up", () -> "operation", () -> "replayed"));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
        verify(repository, never()).saveAndFlush(any());
    }

    private DriverActionIdempotencyService service() {
        return new DriverActionIdempotencyService(repository, currentUserService,
                Clock.fixed(Instant.parse("2026-09-03T12:00:00Z"), ZoneOffset.UTC));
    }

    private AuthenticatedUser currentUser() {
        return new AuthenticatedUser(7L, "tenant-123", "driver@example.com", "Taylor", "Jordan", "secret",
                true, true, false, List.of());
    }

    private DriverActionIdempotency record(Long rideId, String action) {
        DriverActionIdempotency record = new DriverActionIdempotency();
        record.setRideId(rideId);
        record.setActionName(action);
        return record;
    }
}