package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.billing.api.request.ManualInvoiceGenerationRequest;
import com.transportplatform.tms.features.billing.domain.InvoiceGenerationIdempotency;
import com.transportplatform.tms.features.billing.domain.InvoiceGenerationIdempotencyRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class InvoiceGenerationIdempotencyServiceTest {

    @Mock
    private InvoiceGenerationIdempotencyRepository repository;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Test
    void claimMarksNewDatabaseClaimAsOwnedByCaller() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        AtomicReference<String> requestHash = new AtomicReference<>();
        InvoiceGenerationIdempotency record = persistedRecord(requestHash, null);
        when(repository.claim(eq("tenant-a"), eq(1L), eq("key-1"), any(), any()))
                .thenAnswer(invocation -> {
                    requestHash.set(invocation.getArgument(3));
                    return 1;
                });
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-a", 1L, "key-1"))
                .thenReturn(Optional.of(record));

        InvoiceGenerationIdempotencyService.Claim claim = service().claim("key-1", request());

        assertTrue(claim.claimedByCaller());
        assertEquals(record, claim.record());
    }

    @Test
    void claimReplaysAnAlreadyCompletedRequest() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        AtomicReference<String> requestHash = new AtomicReference<>();
        InvoiceGenerationIdempotency record = persistedRecord(requestHash, 42L);
        when(repository.claim(eq("tenant-a"), eq(1L), eq("key-1"), any(), any()))
                .thenAnswer(invocation -> {
                    requestHash.set(invocation.getArgument(3));
                    return 0;
                });
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-a", 1L, "key-1"))
                .thenReturn(Optional.of(record));

        InvoiceGenerationIdempotencyService.Claim claim = service().claim("key-1", request());

        assertFalse(claim.claimedByCaller());
        assertEquals(42L, claim.record().getInvoiceId());
    }

    @Test
    void claimRejectsMatchingRequestThatIsStillInProgress() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        AtomicReference<String> requestHash = new AtomicReference<>();
        InvoiceGenerationIdempotency record = persistedRecord(requestHash, null);
        when(record.getInvoiceId()).thenReturn(null);
        when(repository.claim(eq("tenant-a"), eq(1L), eq("key-1"), any(), any()))
                .thenAnswer(invocation -> {
                    requestHash.set(invocation.getArgument(3));
                    return 0;
                });
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-a", 1L, "key-1"))
            .thenReturn(Optional.of(record));

        ApiException exception = assertThrows(ApiException.class, () -> service().claim("key-1", request()));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
        assertEquals(409, exception.getStatus().value());
    }

    private InvoiceGenerationIdempotencyService service() {
        return new InvoiceGenerationIdempotencyService(
                repository,
                currentAuthenticatedUserService,
                Clock.fixed(java.time.Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
    }

    private InvoiceGenerationIdempotency persistedRecord(AtomicReference<String> requestHash, Long paymentId) {
        InvoiceGenerationIdempotency record = mock(InvoiceGenerationIdempotency.class);
        when(record.getRequestHash()).thenAnswer(invocation -> requestHash.get());
        if (paymentId != null) {
            when(record.getInvoiceId()).thenReturn(paymentId);
        }
        return record;
    }

    private AuthenticatedUser billingUser() {
        return new AuthenticatedUser(
                1L,
                "tenant-a",
                "billing@example.com",
                "Billing",
                "User",
                "secret",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_BILLING_ADMIN.name())));
    }

    @Test
    void rejectsMissingInvalidAndMismatchedKeys() {
        assertThrows(ApiException.class, () -> service().claim(null, request()));
        assertThrows(ApiException.class, () -> service().claim(" ", request()));
        assertThrows(ApiException.class, () -> service().claim("non ascii 🐛", request()));
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        var record = mock(InvoiceGenerationIdempotency.class);
        when(record.getRequestHash()).thenReturn("different-request");
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-a", 1L, "key-1"))
            .thenReturn(Optional.of(record));
        assertEquals(409, assertThrows(ApiException.class,
            () -> service().claim("key-1", request())).getStatus().value());
    }

    private ManualInvoiceGenerationRequest request() {
        return new ManualInvoiceGenerationRequest(
            com.transportplatform.tms.features.billing.domain.BillToType.RIDER, 9L,
            null, null, List.of(11L), null, null, null, null, null, null, null,
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), "USD",
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("12.34"), "Approved", null, null);
    }
}
