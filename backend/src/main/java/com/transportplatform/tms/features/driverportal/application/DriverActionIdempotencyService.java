package com.transportplatform.tms.features.driverportal.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotency;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotencyRepository;
import java.time.Clock;
import java.util.Objects;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverActionIdempotencyService {
    private final DriverActionIdempotencyRepository repository;
    private final CurrentAuthenticatedUserService currentUserService;
    private final Clock clock;

    public DriverActionIdempotencyService(DriverActionIdempotencyRepository repository,
            CurrentAuthenticatedUserService currentUserService, Clock clock) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional
    public <T> T execute(String key, Long rideId, String action, Supplier<T> operation, Supplier<T> replayResult) {
        if (key == null || key.isBlank()) return operation.get();
        if (key.length() > 120) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "Idempotency-Key must be 120 characters or fewer.");
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        var existing = repository.findByTenantIdAndUserIdAndIdempotencyKey(user.tenantId(), user.id(), key);
        if (existing.isPresent()) {
            ensureMatchesOriginalRequest(existing.get(), rideId, action);
            return replayResult.get();
        }
        DriverActionIdempotency record = new DriverActionIdempotency();
        record.setTenantId(user.tenantId());
        record.setUserId(user.id());
        record.setIdempotencyKey(key);
        record.setRideId(rideId);
        record.setActionName(action);
        record.setCreatedAt(clock.instant());
        repository.saveAndFlush(record);
        return operation.get();
    }

    private void ensureMatchesOriginalRequest(DriverActionIdempotency record, Long rideId, String action) {
        if (!Objects.equals(record.getRideId(), rideId) || !Objects.equals(record.getActionName(), action)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.CONFLICT,
                    "Idempotency-Key has already been used for a different driver action.");
        }
    }
}
