package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.SecurityProperties;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AuthRefreshSession;
import com.transportplatform.tms.features.auth.domain.AuthRefreshSessionRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthSessionService {
    private final AuthRefreshSessionRepository repository;
    private final SecurityProperties securityProperties;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthSessionService(AuthRefreshSessionRepository repository, SecurityProperties securityProperties, Clock clock) {
        this.repository = repository;
        this.securityProperties = securityProperties;
        this.clock = clock;
    }

    @Transactional
    public IssuedRefreshToken issue(AppUser user, String clientType) {
        return create(user, UUID.randomUUID().toString(), normalizeClientType(clientType));
    }

    @Transactional(noRollbackFor = ApiException.class)
    public RotatedRefreshToken rotate(String rawToken, String requestedClientType) {
        Instant now = clock.instant();
        AuthRefreshSession current = repository.findByTokenHash(hash(rawToken)).orElseThrow(this::invalidToken);
        if (current.getUsedAt() != null || current.getReplacedByTokenHash() != null) {
            repository.revokeFamily(current.getFamilyId(), now);
            throw invalidToken();
        }
        if (current.getRevokedAt() != null || !current.getExpiresAt().isAfter(now)) throw invalidToken();
        String clientType = normalizeClientType(requestedClientType);
        if (!current.getClientType().equals(clientType)) throw invalidToken();

        IssuedRefreshToken replacement = create(current.getUser(), current.getFamilyId(), clientType);
        current.setUsedAt(now);
        current.setReplacedByTokenHash(hash(replacement.rawToken()));
        repository.save(current);
        return new RotatedRefreshToken(current.getUser(), replacement);
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        repository.findByTokenHash(hash(rawToken))
                .ifPresent(session -> repository.revokeFamily(session.getFamilyId(), clock.instant()));
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        repository.revokeAllForUser(userId, clock.instant());
    }

    @Transactional
    public void revokeAllForTenant(String tenantId) {
        repository.revokeAllForTenant(tenantId, clock.instant());
    }

    private IssuedRefreshToken create(AppUser user, String familyId, String clientType) {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        AuthRefreshSession session = new AuthRefreshSession();
        session.setUser(user);
        session.setFamilyId(familyId);
        session.setTokenHash(hash(rawToken));
        session.setIssuedAt(now);
        session.setExpiresAt(now.plus(securityProperties.getJwt().getRefreshTokenTtl()));
        session.setClientType(clientType);
        repository.save(session);
        return new IssuedRefreshToken(rawToken, session.getExpiresAt(), clientType);
    }

    private String normalizeClientType(String clientType) {
        return "mobile".equalsIgnoreCase(clientType) ? "MOBILE" : "WEB";
    }

    private String hash(String token) {
        if (token == null || token.isBlank()) throw invalidToken();
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ApiException invalidToken() {
        return new ApiException(ErrorCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED,
                "The refresh session is invalid or expired.");
    }

    public record IssuedRefreshToken(String rawToken, Instant expiresAt, String clientType) {}
    public record RotatedRefreshToken(AppUser user, IssuedRefreshToken token) {}
}
