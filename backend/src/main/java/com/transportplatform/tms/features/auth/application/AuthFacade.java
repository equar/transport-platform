package com.transportplatform.tms.features.auth.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.transportplatform.tms.features.auth.api.request.ResetPasswordRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import com.transportplatform.tms.features.companyapplication.application.TenantEmailVerificationService;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;

@Service
public class AuthFacade {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthSessionService authSessionService;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final TenantRepository tenantRepository;
    private final AuditLogService auditLogService;
    private final NotificationEmailSender notificationEmailSender;
    private final AuthFlowProperties authFlowProperties;
    private final Clock clock;
    private final TenantEmailVerificationService onboarding;

    public AuthFacade(AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthSessionService authSessionService,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            TenantRepository tenantRepository,
            AuditLogService auditLogService,
            NotificationEmailSender notificationEmailSender,
            AuthFlowProperties authFlowProperties,
            Clock clock, TenantEmailVerificationService onboarding) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authSessionService = authSessionService;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.tenantRepository = tenantRepository;
        this.auditLogService = auditLogService;
        this.notificationEmailSender = notificationEmailSender;
        this.authFlowProperties = authFlowProperties;
        this.clock = clock;
        this.onboarding = onboarding;
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request, String clientType) {
        AppUser user = appUserRepository.findForAuthenticationByEmail(request.email())
                .orElseThrow(this::invalidCredentials);
        if (!com.transportplatform.tms.common.security.PasswordEncoding.matches(passwordEncoder, request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        ensureEligibleForTokenIssuance(user, false);
        ensureClientAllowed(user, clientType, false);
        ensureMfaComplete(user, request.mfaCode());
        ensureTenantActive(user);

        user.setLastLoginAt(clock.instant());

        return issueTokens(user, authSessionService.issue(user, clientType));
    }

    @Transactional(noRollbackFor = ApiException.class)
    public AuthTokensResponse refresh(String refreshToken, String clientType) {
        AuthSessionService.RotatedRefreshToken rotated = authSessionService.rotate(refreshToken, clientType);
        AppUser user = rotated.user();
        ensureEligibleForTokenIssuance(user, true);
        ensureClientAllowed(user, clientType, true);
        ensureTenantActive(user);
        return issueTokens(user, rotated.token());
    }

    public void logout(String refreshToken) {
        authSessionService.revoke(refreshToken);
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        AuthenticatedUser currentUser = currentAuthenticatedUserService.requireCurrentUser();
        AppUser user = appUserRepository.findById(currentUser.id())
                .orElseThrow(this::invalidCredentials);

        if (!com.transportplatform.tms.common.security.PasswordEncoding.matches(passwordEncoder, request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.INVALID_CREDENTIALS,
                    HttpStatus.BAD_REQUEST,
                    "The current password is incorrect.");
        }

        if (com.transportplatform.tms.common.security.PasswordEncoding.matches(passwordEncoder, request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "The new password must be different from the current password.");
        }

        applyPassword(user, request.newPassword(), false);
        clearPasswordResetState(user);
        authSessionService.revokeAllForUser(user.getId());
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
        authSessionService.revokeAllForUser(user.getId());
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

    private AuthTokensResponse issueTokens(AppUser appUser, AuthSessionService.IssuedRefreshToken refresh) {
        AuthenticatedUser user = toPrincipal(appUser);
        String accessToken = jwtService.generateAccessToken(user);
        JwtClaims claims = jwtService.parseAccessToken(accessToken);
        return new AuthTokensResponse(
                accessToken,
                refresh.rawToken(),
                "Bearer",
            claims.expiresAt().getEpochSecond() - claims.issuedAt().getEpochSecond(),
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
                user.isEnabled(),
                !user.isLocked(),
                user.isMustChangePassword(),
                user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.name())).toList(), user.getSecurityVersion());
    }

    private void ensureClientAllowed(AppUser user, String clientType, boolean revokeSessionsOnFailure) {
        boolean mobileOnly = user.getRoles().stream().anyMatch(role ->
                role == com.transportplatform.tms.features.auth.domain.RoleName.ROLE_DRIVER
                        || role == com.transportplatform.tms.features.auth.domain.RoleName.ROLE_RIDER
                        || role == com.transportplatform.tms.features.auth.domain.RoleName.ROLE_GUARDIAN);
        if (mobileOnly && !"MOBILE".equalsIgnoreCase(clientType)) {
            if (revokeSessionsOnFailure) {
                authSessionService.revokeWebForUser(user.getId());
            }
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Rider, driver and guardian accounts must sign in using the Bakaroo Transport mobile app.");
        }
    }

    private void ensureEligibleForTokenIssuance(AppUser user, boolean revokeSessionsOnFailure) {
        if (!user.isActiveForLogin() || user.isTemporaryPasswordExpired(clock.instant())) {
            if (revokeSessionsOnFailure) {
                authSessionService.revokeAllForUser(user.getId());
            }
            throw invalidCredentials();
        }
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            if (revokeSessionsOnFailure) {
                authSessionService.revokeAllForUser(user.getId());
            }
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "This account has no assigned role. Contact an administrator.");
        }
        boolean platform = user.getRoles().contains(com.transportplatform.tms.features.auth.domain.RoleName.ROLE_PLATFORM_ADMIN);
        if ((platform && (user.getTenantId() != null || user.getRoles().size() != 1))
                || (!platform && (user.getTenantId() == null || user.getTenantId().isBlank()))) throw invalidCredentials();
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

    private void ensureMfaComplete(AppUser user, String mfaCode) {
        if (authFlowProperties == null || !authFlowProperties.isRequireMfaForPrivilegedAccounts()) {
            return;
        }
        boolean privileged = user.getRoles().stream().anyMatch(role ->
                role == com.transportplatform.tms.features.auth.domain.RoleName.ROLE_PLATFORM_ADMIN
                        || role == com.transportplatform.tms.features.auth.domain.RoleName.ROLE_TENANT_ADMIN);
        if (!privileged) {
            return;
        }
        if (mfaCode == null || mfaCode.isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.UNAUTHORIZED,
                    "Multi-factor authentication is required to sign in with an administrative account.");
        }
        String expected = System.getenv().getOrDefault("APP_AUTH_ADMIN_MFA_CODE", "").trim();
        if (expected.isBlank() || !expected.equals(mfaCode.trim())) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.UNAUTHORIZED,
                    "The administrative MFA code is invalid or not configured.");
        }
    }

    private void applyPassword(AppUser user, String rawPassword, boolean mustChangePassword) {
        user.setPasswordHash(com.transportplatform.tms.common.security.PasswordEncoding.encode(passwordEncoder, rawPassword));
        user.setPasswordChangedAt(clock.instant());
        user.setMustChangePassword(mustChangePassword);
        user.setTemporaryPasswordExpiresAt(null);
    }

    private void clearPasswordResetState(AppUser user) {
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetRequestedAt(null);
        user.setPasswordResetTokenExpiresAt(null);
    }

    private String buildPasswordResetLink(String rawToken) {
        String baseUrl = authFlowProperties.getPasswordResetBaseUrl();
        String encodedToken = java.net.URLEncoder.encode(rawToken, java.nio.charset.StandardCharsets.UTF_8);
        if (baseUrl.contains("#")) {
            return baseUrl + "&token=" + encodedToken;
        }
        return baseUrl + "#token=" + encodedToken;
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

    private void ensureTenantActive(AppUser user) {
        String tenantId = user.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        if (tenantRepository.findById(tenantId).map(tenant -> tenant.getStatus() == TenantStatus.PENDING).orElse(false)) {
            onboarding.activateCompletedOwner(user);
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
