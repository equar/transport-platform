package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.billing.api.request.PaymentUpsertRequest;
import com.transportplatform.tms.features.billing.domain.PaymentCreationIdempotency;
import com.transportplatform.tms.features.billing.domain.PaymentCreationIdempotencyRepository;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PaymentCreationIdempotencyService {

    private final PaymentCreationIdempotencyRepository repository;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final Clock clock;

    public PaymentCreationIdempotencyService(PaymentCreationIdempotencyRepository repository,
            CurrentAuthenticatedUserService currentAuthenticatedUserService, Clock clock) {
        this.repository = repository;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.clock = clock;
    }

    public Claim claim(String idempotencyKey, PaymentUpsertRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }
        if (idempotencyKey.length() > 120) {
            throw validationFailure("Idempotency-Key must be 120 characters or fewer.");
        }
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        String requestHash = hash(request);
        boolean claimedByCaller = repository.claim(
            user.tenantId(), user.id(), idempotencyKey, requestHash, clock.instant()) == 1;
        PaymentCreationIdempotency record = repository
                .findByTenantIdAndUserIdAndIdempotencyKey(user.tenantId(), user.id(), idempotencyKey)
                .orElseThrow(() -> new IllegalStateException("Payment idempotency record was not created."));
        if (!record.getRequestHash().equals(requestHash)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.CONFLICT,
                    "Idempotency-Key has already been used for a different payment request.");
        }
        if (!claimedByCaller && record.getPaymentId() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.CONFLICT,
                "A payment request with this Idempotency-Key is currently being processed.");
        }
        return new Claim(record, claimedByCaller);
    }

        public record Claim(PaymentCreationIdempotency record, boolean claimedByCaller) {
        }

    private String hash(PaymentUpsertRequest request) {
        String canonicalRequest = String.join("\n",
                String.valueOf(request.invoiceId()),
                String.valueOf(request.paymentDate()),
                request.amount().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                String.valueOf(request.paymentMethod()),
                value(request.referenceNumber()), value(request.payerName()), value(request.payerContact()),
                value(request.externalTransactionId()), value(request.notes()),
                String.valueOf(request.applyImmediately() == null || request.applyImmediately()));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonicalRequest.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    private String value(String value) {
        return value == null ? "<null>" : value;
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}