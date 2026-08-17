package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.security.JwtClaims;
import com.transportplatform.tms.common.security.JwtService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.api.request.ChangePasswordRequest;
import com.transportplatform.tms.features.auth.api.request.ForgotPasswordRequest;
import com.transportplatform.tms.features.auth.api.request.LoginRequest;
import com.transportplatform.tms.features.auth.api.request.RefreshTokenRequest;
import com.transportplatform.tms.features.auth.api.request.ResetPasswordRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthFacade {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final TenantRepository tenantRepository;
    private final AuditLogService auditLogService;
    private final NotificationEmailSender notificationEmailSender;
    private final AuthFlowProperties authFlowProperties;
    private final Clock clock;

    public AuthFacade(AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            TenantRepository tenantRepository,
            AuditLogService auditLogService,
            NotificationEmailSender notificationEmailSender,
            AuthFlowProperties authFlowProperties,
            Clock clock) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.tenantRepository = tenantRepository;
        this.auditLogService = auditLogService;
        this.notificationEmailSender = notificationEmailSender;
        this.authFlowProperties = authFlowProperties;
        this.clock = clock;
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findForAuthenticationByEmail(request.email())
                .orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        if (!user.isActiveForLogin()) {
            throw invalidCredentials();
        }
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "This account has no assigned role. Contact an administrator.");
        }
        ensureTenantActive(user.getTenantId());

        user.setLastLoginAt(clock.instant());

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
            if (user.getPasswordChangedAt() != null && claims.issuedAt().isBefore(user.getPasswordChangedAt())) {
                throw invalidCredentials();
            }
            ensureTenantActive(user.getTenantId());

            return issueTokens(toPrincipal(user));
        } catch (JwtException exception) {
            throw invalidCredentials();
        }
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        AuthenticatedUser currentUser = currentAuthenticatedUserService.requireCurrentUser();
        AppUser user = appUserRepository.findById(currentUser.id())
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

        applyPassword(user, request.newPassword(), false);
        clearPasswordResetState(user);
        auditLogService.record(new AuditLogCommand(
                null,
                user.getTenantId(),
                "AUTH",
                "PASSWORD_CHANGED",
                "USER",
                String.valueOf(user.getId()),
                "User changed their own password.",
                null,
                Map.of("userId", user.getId(), "email", user.getEmail())));
        return "Password updated successfully.";
    }

    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request) {
        appUserRepository.findForAuthenticationByEmail(request.email().trim())
                .filter(AppUser::isActiveForLogin)
                .ifPresent(this::preparePasswordReset);
        return "If an account exists for that email address, password recovery instructions will be sent.";
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        AppUser user = appUserRepository.findByPasswordResetTokenHash(hashResetToken(request.token().trim()))
                .orElseThrow(this::invalidResetToken);
        if (user.getPasswordResetTokenExpiresAt() == null
                || user.getPasswordResetTokenExpiresAt().isBefore(clock.instant())) {
            throw expiredResetToken();
        }
        applyPassword(user, request.password(), false);
        clearPasswordResetState(user);
        auditLogService.record(new AuditLogCommand(
                null,
                user.getTenantId(),
                "AUTH",
                "PASSWORD_RESET_COMPLETED",
                "USER",
                String.valueOf(user.getId()),
                "User completed a password reset.",
                null,
                Map.of("userId", user.getId(), "email", user.getEmail())));
        return "Password reset successfully.";
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
                        user.mustChangePassword(),
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
                user.isMustChangePassword(),
                user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.name())).toList());
    }

    private void preparePasswordReset(AppUser user) {
        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
        user.setPasswordResetTokenHash(hashResetToken(rawToken));
        user.setPasswordResetRequestedAt(clock.instant());
        user.setPasswordResetTokenExpiresAt(clock.instant().plus(authFlowProperties.getPasswordResetTtl()));
        auditLogService.record(new AuditLogCommand(
                null,
                user.getTenantId(),
                "AUTH",
                "PASSWORD_RESET_REQUESTED",
                "USER",
                String.valueOf(user.getId()),
                "Password reset requested.",
                null,
                Map.of("userId", user.getId(), "email", user.getEmail())));
        String link = buildPasswordResetLink(rawToken);
        notificationEmailSender.send(new NotificationEmailSender.NotificationEmailCommand(
                user.getEmail(),
                "Password reset request",
                "Password reset request",
                "A password reset was requested for your account. Use this link to continue: " + link));
    }

    private void applyPassword(AppUser user, String rawPassword, boolean mustChangePassword) {
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPasswordChangedAt(clock.instant());
        user.setMustChangePassword(mustChangePassword);
    }

    private void clearPasswordResetState(AppUser user) {
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetRequestedAt(null);
        user.setPasswordResetTokenExpiresAt(null);
    }

    private String buildPasswordResetLink(String rawToken) {
        String baseUrl = authFlowProperties.getPasswordResetBaseUrl();
        return baseUrl.contains("?")
                ? baseUrl + "&token=" + rawToken
                : baseUrl + "?token=" + rawToken;
    }

    private String hashResetToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private ApiException invalidCredentials() {
        return new ApiException(
                ErrorCode.INVALID_CREDENTIALS,
                HttpStatus.UNAUTHORIZED,
                "The provided credentials are invalid.");
    }

    private ApiException invalidResetToken() {
        return new ApiException(
                ErrorCode.INVALID_CREDENTIALS,
                HttpStatus.BAD_REQUEST,
                "This reset link is invalid. Request a new one to continue.");
    }

    private ApiException expiredResetToken() {
        return new ApiException(
                ErrorCode.INVALID_CREDENTIALS,
                HttpStatus.BAD_REQUEST,
                "This reset link has expired. Request a new one to continue.");
    }

    private void ensureTenantActive(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        if (tenantRepository.findById(tenantId)
                .map(tenant -> tenant.getStatus() == TenantStatus.ACTIVE)
                .orElse(false)) {
            return;
        }
        throw new ApiException(
                ErrorCode.FORBIDDEN,
                HttpStatus.FORBIDDEN,
                "This company account is not active. Contact the platform administrator.");
    }
}
