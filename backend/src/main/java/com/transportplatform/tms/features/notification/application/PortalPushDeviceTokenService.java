package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.notification.domain.PortalPushDeviceToken;
import com.transportplatform.tms.features.notification.domain.PortalPushDeviceTokenPlatform;
import com.transportplatform.tms.features.notification.domain.PortalPushDeviceTokenRepository;
import com.transportplatform.tms.features.notification.domain.PortalPushDeviceTokenStatus;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortalPushDeviceTokenService {

    private final PortalPushDeviceTokenRepository portalPushDeviceTokenRepository;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final Clock clock;

    public PortalPushDeviceTokenService(PortalPushDeviceTokenRepository portalPushDeviceTokenRepository,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            Clock clock) {
        this.portalPushDeviceTokenRepository = portalPushDeviceTokenRepository;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.clock = clock;
    }

    @Transactional
    public void registerCurrentUserToken(String token, String platform) {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        if (user.id() == null || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "A tenant-scoped portal user is required to register push notifications.");
        }

        Instant now = Instant.now(clock);
        PortalPushDeviceToken entity = portalPushDeviceTokenRepository.findByPushToken(token.trim())
                .orElseGet(PortalPushDeviceToken::new);
        entity.setTenantId(user.tenantId());
        entity.setAppUserId(user.id());
        entity.setPushToken(token.trim());
        entity.setPlatform(resolvePlatform(platform));
        entity.setStatus(PortalPushDeviceTokenStatus.ACTIVE);
        entity.setLastRegisteredAt(now);
        entity.setLastDeliveryError(null);
        entity.setLastDeliveryStatus(null);
        portalPushDeviceTokenRepository.save(entity);
    }

    @Transactional
    public void unregisterCurrentUserToken(String token) {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        if (user.id() == null || user.tenantId() == null || user.tenantId().isBlank()) {
            return;
        }
        portalPushDeviceTokenRepository.findByTenantIdAndAppUserIdAndPushToken(user.tenantId(), user.id(), token.trim())
                .ifPresent(entity -> {
                    entity.setStatus(PortalPushDeviceTokenStatus.INACTIVE);
                    portalPushDeviceTokenRepository.save(entity);
                });
    }

    @Transactional(readOnly = true)
    public List<PortalPushDeviceToken> findActiveTokens(String tenantId, Long appUserId) {
        if (tenantId == null || tenantId.isBlank() || appUserId == null) {
            return List.of();
        }
        return portalPushDeviceTokenRepository.findAllByTenantIdAndAppUserIdAndStatus(
                tenantId,
                appUserId,
                PortalPushDeviceTokenStatus.ACTIVE);
    }

    @Transactional
    public void markDeliveryResult(Long tokenId, boolean sent, String errorMessage) {
        portalPushDeviceTokenRepository.findById(tokenId).ifPresent(entity -> {
            entity.setLastDeliveredAt(Instant.now(clock));
            entity.setLastDeliveryStatus(sent ? "SENT" : "FAILED");
            entity.setLastDeliveryError(errorMessage == null || errorMessage.isBlank() ? null : errorMessage.trim());
            if (!sent && errorMessage != null && errorMessage.toLowerCase().contains("devicenotregistered")) {
                entity.setStatus(PortalPushDeviceTokenStatus.INACTIVE);
            }
            portalPushDeviceTokenRepository.save(entity);
        });
    }

    private PortalPushDeviceTokenPlatform resolvePlatform(String platform) {
        if (platform == null || platform.isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Platform is required for push token registration.");
        }
        try {
            return PortalPushDeviceTokenPlatform.valueOf(platform.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Unsupported push token platform.");
        }
    }
}
