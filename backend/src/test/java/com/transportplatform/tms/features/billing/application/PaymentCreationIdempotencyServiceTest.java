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
import com.transportplatform.tms.features.billing.api.request.PaymentUpsertRequest;
import com.transportplatform.tms.features.billing.domain.PaymentCreationIdempotency;
import com.transportplatform.tms.features.billing.domain.PaymentCreationIdempotencyRepository;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
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
class PaymentCreationIdempotencyServiceTest {

    @Mock
    private PaymentCreationIdempotencyRepository repository;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Test
    void claimMarksNewDatabaseClaimAsOwnedByCaller() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        AtomicReference<String> requestHash = new AtomicReference<>();
        PaymentCreationIdempotency record = persistedRecord(requestHash, null);
        when(repository.claim(eq("tenant-a"), eq(1L), eq("key-1"), any(), any()))
                .thenAnswer(invocation -> {
                    requestHash.set(invocation.getArgument(3));
                    return 1;
                });
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-a", 1L, "key-1"))
                .thenReturn(Optional.of(record));

        PaymentCreationIdempotencyService.Claim claim = service().claim("key-1", request());

        assertTrue(claim.claimedByCaller());
        assertEquals(record, claim.record());
    }

    @Test
    void claimReplaysAnAlreadyCompletedRequest() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        AtomicReference<String> requestHash = new AtomicReference<>();
        PaymentCreationIdempotency record = persistedRecord(requestHash, 42L);
        when(repository.claim(eq("tenant-a"), eq(1L), eq("key-1"), any(), any()))
                .thenAnswer(invocation -> {
                    requestHash.set(invocation.getArgument(3));
                    return 0;
                });
        when(repository.findByTenantIdAndUserIdAndIdempotencyKey("tenant-a", 1L, "key-1"))
                .thenReturn(Optional.of(record));

        PaymentCreationIdempotencyService.Claim claim = service().claim("key-1", request());

        assertFalse(claim.claimedByCaller());
        assertEquals(42L, claim.record().getPaymentId());
    }

    @Test
    void claimRejectsMatchingRequestThatIsStillInProgress() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(billingUser());
        AtomicReference<String> requestHash = new AtomicReference<>();
        PaymentCreationIdempotency record = persistedRecord(requestHash, null);
        when(record.getPaymentId()).thenReturn(null);
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

    private PaymentCreationIdempotencyService service() {
        return new PaymentCreationIdempotencyService(
                repository,
                currentAuthenticatedUserService,
                Clock.fixed(java.time.Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
    }

    private PaymentCreationIdempotency persistedRecord(AtomicReference<String> requestHash, Long paymentId) {
        PaymentCreationIdempotency record = mock(PaymentCreationIdempotency.class);
        when(record.getRequestHash()).thenAnswer(invocation -> requestHash.get());
        if (paymentId != null) {
            when(record.getPaymentId()).thenReturn(paymentId);
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

    private PaymentUpsertRequest request() {
        return new PaymentUpsertRequest(
                9L,
                LocalDate.of(2026, 1, 1),
                new BigDecimal("12.34"),
                PaymentMethod.CASH,
                "reference",
                "Payer",
                "555-0100",
                "external-transaction",
                "notes",
                true);
    }
}