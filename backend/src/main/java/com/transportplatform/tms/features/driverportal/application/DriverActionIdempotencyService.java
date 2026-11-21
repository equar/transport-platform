package com.transportplatform.tms.features.driverportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotency;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotencyRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Objects;
import java.util.function.Supplier;

@Service
public class DriverActionIdempotencyService {
    @org.springframework.beans.factory.annotation.Autowired
    private com.fasterxml.jackson.databind.ObjectMapper mapper;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate db;

    private final DriverActionIdempotencyRepository repository;
    private final CurrentAuthenticatedUserService currentUserService;
    private final Clock clock;

    public DriverActionIdempotencyService(
            DriverActionIdempotencyRepository repository,
            CurrentAuthenticatedUserService currentUserService,
            Clock clock) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional
    public <T> T execute(
            String key,
            Long rideId,
            String action,
            Class<T> resultType,
            Supplier<T> operation,
            Supplier<T> authorizeReplay) {
        if (key == null || key.isBlank())
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.PRECONDITION_REQUIRED,
                    "Idempotency-Key is required for driver actions.");
        if (!key.matches("[A-Za-z0-9._:-]{1,120}"))
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Idempotency-Key must use 1–120 ASCII letters, digits, dots, underscores, colons or hyphens.");
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        // Same tenant lock as all dispatch/financial writes; duplicate keys serialize before
        // lookup.
        db.queryForList("SELECT id FROM tenants WHERE id=? FOR UPDATE", user.tenantId());
        var existing =
                repository.findByTenantIdAndUserIdAndIdempotencyKey(
                        user.tenantId(), user.id(), key);
        if (existing.isPresent()) {
            ensureMatchesOriginalRequest(existing.get(), rideId, action);
            authorizeReplay
                    .get(); // Re-check assignment/tenant access without replaying the transition.
            if (existing.get().getResultJson() == null)
                throw new ApiException(
                        ErrorCode.RESOURCE_CONFLICT,
                        HttpStatus.CONFLICT,
                        "This action has no stored result. Refresh the trip before continuing.");
            try {
                return mapper.readValue(existing.get().getResultJson(), resultType);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                throw new IllegalStateException("Stored driver action result is unavailable.");
            }
        }
        DriverActionIdempotency record = new DriverActionIdempotency();
        record.setTenantId(user.tenantId());
        record.setUserId(user.id());
        record.setIdempotencyKey(key);
        record.setRideId(rideId);
        record.setActionName(action);
        record.setCreatedAt(clock.instant());
        repository.saveAndFlush(record);
        T result = operation.get();
        try {
            record.setResultJson(mapper.writeValueAsString(result));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Driver action result could not be stored.");
        }
        repository.save(record);
        return result;
    }

    private void ensureMatchesOriginalRequest(
            DriverActionIdempotency record, Long rideId, String action) {
        if (!Objects.equals(record.getRideId(), rideId)
                || !Objects.equals(record.getActionName(), action)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.CONFLICT,
                    "Idempotency-Key has already been used for a different driver action.");
        }
    }
}
