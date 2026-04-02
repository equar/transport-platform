package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.security.JwtClaims;
import com.transportplatform.tms.common.security.JwtService;
import com.transportplatform.tms.common.security.SecurityProperties;
import com.transportplatform.tms.features.auth.api.request.ChangePasswordRequest;
import com.transportplatform.tms.features.auth.api.request.ForgotPasswordRequest;
import com.transportplatform.tms.features.auth.api.request.LoginRequest;
import com.transportplatform.tms.features.auth.api.request.ResetPasswordRequest;
import com.transportplatform.tms.features.auth.api.request.RefreshTokenRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.PasswordResetToken;
import com.transportplatform.tms.features.auth.domain.PasswordResetTokenRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.notification.application.InvitationDeliveryResult;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class AuthFacade {

    private static final String PLATFORM_TENANT_ALIAS = "platform";
    private static final String PASSWORD_RESET_ACCEPTED_MESSAGE = "If an account exists for that workspace and email, password recovery instructions will be prepared for delivery.";

    private final AppUserRepository appUserRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final NotificationEventService notificationEventService;
    private final SecurityProperties securityProperties;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthFacade(AppUserRepository appUserRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            NotificationEventService notificationEventService,
            SecurityProperties securityProperties,
            Clock clock) {
        this.appUserRepository = appUserRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.notificationEventService = notificationEventService;
        this.securityProperties = securityProperties;
        this.clock = clock;
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request) {
        String normalizedTenantId = normalizeTenantId(request.tenantId());
        AppUser user = appUserRepository.findForAuthentication(normalizedTenantId, request.email())
                .orElseThrow(() -> invalidCredentials());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash()) || !user.isActiveForLogin()) {
            throw invalidCredentials();
        }

        user.setLastLoginAt(Instant.now());

        return issueTokens(toPrincipal(user));
    }

    public AuthTokensResponse refresh(RefreshTokenRequest request) {
        try {
            JwtClaims claims = jwtService.parseRefreshToken(request.refreshToken());
            AppUser user = appUserRepository.findForAuthentication(claims.tenantId(), claims.subject())
                    .orElseThrow(this::invalidCredentials);

            if (!user.isActiveForLogin()) {
                throw invalidCredentials();
            }

            return issueTokens(toPrincipal(user));
        } catch (JwtException exception) {
            throw invalidCredentials();
        }
    }

    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request, String remoteAddress) {
        String normalizedTenantId = normalizeTenantId(request.tenantId());
        AppUser user = appUserRepository.findForAuthentication(normalizedTenantId, request.email()).orElse(null);
        if (!isEligibleForCredentialLink(user)) {
            return PASSWORD_RESET_ACCEPTED_MESSAGE;
        }

        notificationEventService.publishPasswordResetRequested(user, issueCredentialLink(user, remoteAddress));
        return PASSWORD_RESET_ACCEPTED_MESSAGE;
    }

    @Transactional
    public void sendInvitation(AppUser user, String remoteAddress) {
        if (!isEligibleForCredentialLink(user) || user.getStatus() != UserStatus.INVITED) {
            return;
        }
        Instant now = clock.instant();
        InvitationDeliveryResult deliveryResult = notificationEventService
                .publishUserInvitation(
                        user,
                        issueCredentialLink(user, remoteAddress));
        user.setLastInvitationSentAt(now);
        user.setInvitationSendCount(user.getInvitationSendCount() + 1);
        user.setLastInvitationDeliveryStatus(deliveryResult.deliveryStatus());
        user.setLastInvitationFailureMessage(trimToNull(deliveryResult.errorMessage()));
        appUserRepository.save(user);
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request, String remoteAddress) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashResetToken(request.token()))
                .orElseThrow(this::invalidPasswordResetToken);
        Instant now = clock.instant();

        if (resetToken.getUsedAt() != null) {
            throw invalidPasswordResetToken();
        }

        if (!resetToken.getExpiresAt().isAfter(now)) {
            throw expiredPasswordResetToken();
        }

        AppUser user = resetToken.getUser();
        if (!isEligibleForCredentialLink(user)) {
            throw invalidPasswordResetToken();
        }

        if (passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "The new password must be different from the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        if (user.getStatus() == UserStatus.INVITED) {
            user.setStatus(UserStatus.ACTIVE);
        }
        expireActiveResetTokens(user.getId(), now, remoteAddress);
        resetToken.markUsed(now, trimToNull(remoteAddress));
        passwordResetTokenRepository.save(resetToken);

        return "The password reset request completed successfully. You can now sign in with your new password.";
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        AuthenticatedUser currentUser = currentAuthenticatedUserService.requireCurrentUser();
        AppUser user = appUserRepository.findByIdAndTenantScope(currentUser.id(), currentUser.tenantId())
                .orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.INVALID_CREDENTIALS,
                    HttpStatus.BAD_REQUEST,
                    "The current password is incorrect.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "The new password must be different from the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return "Password updated successfully.";
    }

    private AuthTokensResponse issueTokens(AuthenticatedUser user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthTokensResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.parseAccessToken(accessToken).expiresAt().getEpochSecond()
                        - jwtService.parseAccessToken(accessToken).issuedAt().getEpochSecond(),
                new AuthTokensResponse.AuthenticatedUserResponse(
                        user.id(),
                        user.getUsername(),
                        user.firstName(),
                        user.lastName(),
                        user.tenantId(),
                        user.isEnabled() ? UserStatus.ACTIVE.name() : UserStatus.INVITED.name(),
                        user.getAuthorities().stream().map(authority -> authority.getAuthority())
                                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new))));
    }

    private AuthenticatedUser toPrincipal(AppUser user) {
        return new AuthenticatedUser(
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPasswordHash(),
                user.isActiveForLogin(),
                user.getStatus() != UserStatus.SUSPENDED,
                user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.name())).toList());
    }

    private String normalizeTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        return PLATFORM_TENANT_ALIAS.equalsIgnoreCase(tenantId.trim()) ? null : tenantId.trim();
    }

    private void expireActiveResetTokens(Long userId, Instant now, String remoteAddress) {
        for (PasswordResetToken activeToken : passwordResetTokenRepository.findActiveTokensForUser(userId, now)) {
            activeToken.markUsed(now, trimToNull(remoteAddress));
        }
    }

    private String issueCredentialLink(AppUser user, String remoteAddress) {
        Instant now = clock.instant();
        expireActiveResetTokens(user.getId(), now, remoteAddress);

        String rawToken = generateRawResetToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(hashResetToken(rawToken));
        resetToken.setExpiresAt(now.plus(securityProperties.getPasswordReset().getTtl()));
        resetToken.setRequestedByIpAddress(trimToNull(remoteAddress));
        passwordResetTokenRepository.save(resetToken);
        return buildResetUrl(rawToken);
    }

    private String buildResetUrl(String rawToken) {
        return UriComponentsBuilder.fromUriString(securityProperties.getPasswordReset().getPublicUrl())
                .queryParam("token", rawToken)
                .build(true)
                .toUriString();
    }

    private boolean isEligibleForCredentialLink(AppUser user) {
        return user != null
                && user.getId() != null
                && !Objects.equals(user.getStatus(), UserStatus.SUSPENDED)
                && !Objects.equals(user.getStatus(), UserStatus.DEACTIVATED);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String generateRawResetToken() {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashResetToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required for password reset token hashing.", exception);
        }
    }

    private ApiException invalidCredentials() {
        return new ApiException(
                ErrorCode.INVALID_CREDENTIALS,
                HttpStatus.UNAUTHORIZED,
                "The provided credentials are invalid.");
    }

    private ApiException invalidPasswordResetToken() {
        return new ApiException(
                ErrorCode.RESOURCE_NOT_FOUND,
                HttpStatus.NOT_FOUND,
                "This reset link is invalid. Request a new one to continue.");
    }

    private ApiException expiredPasswordResetToken() {
        return new ApiException(
                ErrorCode.BAD_REQUEST,
                HttpStatus.BAD_REQUEST,
                "This reset link has expired. Request a new one to continue.");
    }
}
