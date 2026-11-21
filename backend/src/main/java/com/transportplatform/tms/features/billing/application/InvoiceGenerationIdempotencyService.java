package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.billing.api.request.ManualInvoiceGenerationRequest;
import com.transportplatform.tms.features.billing.domain.InvoiceGenerationIdempotency;
import com.transportplatform.tms.features.billing.domain.InvoiceGenerationIdempotencyRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class InvoiceGenerationIdempotencyService {

    private final InvoiceGenerationIdempotencyRepository repository;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final Clock clock;

    public InvoiceGenerationIdempotencyService(InvoiceGenerationIdempotencyRepository repository,
            CurrentAuthenticatedUserService currentAuthenticatedUserService, Clock clock) {
        this.repository = repository;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.clock = clock;
    }

    public Claim claim(String idempotencyKey, ManualInvoiceGenerationRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw validationFailure("Idempotency-Key is required for invoice generation.");
        }
        if (!idempotencyKey.matches("[A-Za-z0-9._:-]{1,120}")) {
            throw validationFailure("Idempotency-Key must contain 1–120 ASCII letters, digits, dots, underscores, colons or hyphens.");
        }
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        String requestHash = hash(request);
        boolean claimedByCaller = repository.claim(
            user.tenantId(), user.id(), idempotencyKey, requestHash, clock.instant()) == 1;
        InvoiceGenerationIdempotency record = repository
                .findByTenantIdAndUserIdAndIdempotencyKey(user.tenantId(), user.id(), idempotencyKey)
                .orElseThrow(() -> new IllegalStateException("Invoice idempotency record was not created."));
        if (!record.getRequestHash().equals(requestHash)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.CONFLICT,
                    "Idempotency-Key has already been used for a different invoice request.");
        }
        if (!claimedByCaller && record.getInvoiceId() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.CONFLICT,
                "An invoice request with this Idempotency-Key is currently being processed.");
        }
        return new Claim(record, claimedByCaller);
    }

        public record Claim(InvoiceGenerationIdempotency record, boolean claimedByCaller) {
        }

    private String hash(ManualInvoiceGenerationRequest request) {
        String canonicalRequest;
        try {
            canonicalRequest = new com.fasterxml.jackson.databind.ObjectMapper()
                .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
                .writeValueAsString(request);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("Invoice request could not be encoded.", e);
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonicalRequest.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}