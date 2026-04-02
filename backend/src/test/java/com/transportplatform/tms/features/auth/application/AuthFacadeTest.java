package com.transportplatform.tms.features.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.security.JwtClaims;
import com.transportplatform.tms.common.security.JwtService;
import com.transportplatform.tms.common.security.SecurityProperties;
import com.transportplatform.tms.features.auth.api.request.ChangePasswordRequest;
import com.transportplatform.tms.features.auth.api.request.ForgotPasswordRequest;
import com.transportplatform.tms.features.auth.api.request.LoginRequest;
import com.transportplatform.tms.features.auth.api.request.ResetPasswordRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.PasswordResetToken;
import com.transportplatform.tms.features.auth.domain.PasswordResetTokenRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.notification.application.InvitationDeliveryResult;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.Optional;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthFacadeTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private NotificationEventService notificationEventService;

    @Mock
    private SecurityProperties securityProperties;

    @Mock
    private Clock clock;

    @InjectMocks
    private AuthFacade authFacade;

    @Test
    void loginRejectsNonActiveUsers() {
        AppUser user = buildUser(UserStatus.SUSPENDED);
        when(appUserRepository.findForAuthentication(null, "ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("platform", "ops@example.com", "secret123")));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    @Test
    void loginReturnsRicherIdentityPayload() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        when(appUserRepository.findForAuthentication(null, "ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        when(jwtService.generateAccessToken(any(AuthenticatedUser.class)))
                .thenReturn("access");
        when(jwtService.generateRefreshToken(any(AuthenticatedUser.class)))
                .thenReturn("refresh");
        when(jwtService.parseAccessToken("access")).thenReturn(new JwtClaims(
                42L,
                "ops@example.com",
                "Alex",
                "Morgan",
                null,
                Set.of(RoleName.ROLE_PLATFORM_ADMIN.name()),
                "ACCESS",
                Instant.parse("2025-01-01T00:00:00Z"),
                Instant.parse("2025-01-01T00:15:00Z")));

        AuthTokensResponse response = authFacade.login(new LoginRequest("platform", "ops@example.com", "secret123"));

        assertEquals(42L, response.user().id());
        assertEquals("Alex", response.user().firstName());
        assertEquals(UserStatus.ACTIVE.name(), response.user().status());
    }

    @Test
    void changePasswordUsesTenantScopedUserLookup() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-123");
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(new AuthenticatedUser(
                42L,
                "tenant-123",
                "ops@example.com",
                "Alex",
                "Morgan",
                "hashed-password",
                true,
                true,
                java.util.List.of()));
        when(appUserRepository.findByIdAndTenantScope(42L, "tenant-123")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current-secret", "hashed-password")).thenReturn(true);
        when(passwordEncoder.matches("next-secret-123", "hashed-password")).thenReturn(false);
        when(passwordEncoder.encode("next-secret-123")).thenReturn("re-hashed-password");

        String result = authFacade.changePassword(new ChangePasswordRequest("current-secret", "next-secret-123"));

        assertEquals("Password updated successfully.", result);
        assertEquals("re-hashed-password", user.getPasswordHash());
    }

    @Test
    void changePasswordRejectsUsersOutsideCurrentTenantScope() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(new AuthenticatedUser(
                42L,
                "tenant-123",
                "ops@example.com",
                "Alex",
                "Morgan",
                "hashed-password",
                true,
                true,
                java.util.List.of()));
        when(appUserRepository.findByIdAndTenantScope(42L, "tenant-123")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.changePassword(new ChangePasswordRequest("current-secret", "next-secret-123")));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    @Test
    void requestPasswordResetCreatesTokenAndPublishesNotification() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-123");
        SecurityProperties.PasswordReset passwordReset = new SecurityProperties.PasswordReset();
        passwordReset.setPublicUrl("http://localhost:5173/reset-password");
        passwordReset.setTtl(Duration.ofHours(1));
        when(securityProperties.getPasswordReset()).thenReturn(passwordReset);
        when(clock.instant()).thenReturn(Instant.parse("2026-04-02T00:00:00Z"));
        when(appUserRepository.findForAuthentication("tenant-123", "ops@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.findActiveTokensForUser(42L, Instant.parse("2026-04-02T00:00:00Z")))
                .thenReturn(List.of());

        String result = authFacade.requestPasswordReset(
                new ForgotPasswordRequest("tenant-123", "ops@example.com"),
                "10.0.0.5");

        assertEquals(
                "If an account exists for that workspace and email, password recovery instructions will be prepared for delivery.",
                result);
        org.mockito.Mockito.verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        org.mockito.Mockito.verify(notificationEventService).publishPasswordResetRequested(eq(user), any(String.class));
    }

    @Test
    void sendInvitationCreatesTokenAndPublishesInvitation() {
        AppUser user = buildUser(UserStatus.INVITED);
        user.setTenantId("tenant-123");
        SecurityProperties.PasswordReset passwordReset = new SecurityProperties.PasswordReset();
        passwordReset.setPublicUrl("http://localhost:5173/reset-password");
        passwordReset.setTtl(Duration.ofHours(1));
        when(securityProperties.getPasswordReset()).thenReturn(passwordReset);
        when(clock.instant()).thenReturn(Instant.parse("2026-04-02T00:00:00Z"));
        when(passwordResetTokenRepository.findActiveTokensForUser(42L, Instant.parse("2026-04-02T00:00:00Z")))
                .thenReturn(List.of());
        when(notificationEventService.publishUserInvitation(eq(user), any(String.class))).thenReturn(
                new InvitationDeliveryResult(NotificationDeliveryStatus.SENT, null));

        authFacade.sendInvitation(user, null);

        assertEquals(Instant.parse("2026-04-02T00:00:00Z"), user.getLastInvitationSentAt());
        assertEquals(1, user.getInvitationSendCount());
        assertEquals(NotificationDeliveryStatus.SENT, user.getLastInvitationDeliveryStatus());
        org.mockito.Mockito.verify(appUserRepository).save(user);
        org.mockito.Mockito.verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        org.mockito.Mockito.verify(notificationEventService).publishUserInvitation(eq(user), any(String.class));
    }

    @Test
    void sendInvitationRecordsDeliveryFailureMetadata() {
        AppUser user = buildUser(UserStatus.INVITED);
        user.setTenantId("tenant-123");
        SecurityProperties.PasswordReset passwordReset = new SecurityProperties.PasswordReset();
        passwordReset.setPublicUrl("http://localhost:5173/reset-password");
        passwordReset.setTtl(Duration.ofHours(1));
        when(securityProperties.getPasswordReset()).thenReturn(passwordReset);
        when(clock.instant()).thenReturn(Instant.parse("2026-04-02T00:00:00Z"));
        when(passwordResetTokenRepository.findActiveTokensForUser(42L, Instant.parse("2026-04-02T00:00:00Z")))
                .thenReturn(List.of());
        when(notificationEventService.publishUserInvitation(eq(user), any(String.class))).thenReturn(
                new InvitationDeliveryResult(
                        NotificationDeliveryStatus.FAILED,
                        "SMTP unavailable"));

        authFacade.sendInvitation(user, null);

        assertEquals(1, user.getInvitationSendCount());
        assertEquals(NotificationDeliveryStatus.FAILED, user.getLastInvitationDeliveryStatus());
        assertEquals("SMTP unavailable", user.getLastInvitationFailureMessage());
    }

    @Test
    void resetPasswordRejectsExpiredTokens() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(buildUser(UserStatus.ACTIVE));
        token.setTokenHash("hashed-token");
        token.setExpiresAt(Instant.parse("2026-04-01T23:00:00Z"));
        when(passwordResetTokenRepository.findByTokenHash(any(String.class))).thenReturn(Optional.of(token));
        when(clock.instant()).thenReturn(Instant.parse("2026-04-02T00:00:00Z"));

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.resetPassword(new ResetPasswordRequest("raw-token", "next-secret-123"), "10.0.0.5"));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void resetPasswordUpdatesPasswordAndConsumesToken() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-123");
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash("hashed-token");
        token.setExpiresAt(Instant.parse("2026-04-02T01:00:00Z"));
        when(passwordResetTokenRepository.findByTokenHash(any(String.class))).thenReturn(Optional.of(token));
        when(passwordResetTokenRepository.findActiveTokensForUser(42L, Instant.parse("2026-04-02T00:00:00Z")))
                .thenReturn(List.of(token));
        when(clock.instant()).thenReturn(Instant.parse("2026-04-02T00:00:00Z"));
        when(passwordEncoder.matches("next-secret-123", "hashed-password")).thenReturn(false);
        when(passwordEncoder.encode("next-secret-123")).thenReturn("re-hashed-password");

        String result = authFacade.resetPassword(new ResetPasswordRequest("raw-token", "next-secret-123"), "10.0.0.5");

        assertEquals(
                "The password reset request completed successfully. You can now sign in with your new password.",
                result);
        assertEquals("re-hashed-password", user.getPasswordHash());
        org.mockito.Mockito.verify(passwordResetTokenRepository).save(token);
    }

    @Test
    void resetPasswordActivatesInvitedUsers() {
        AppUser user = buildUser(UserStatus.INVITED);
        user.setTenantId("tenant-123");
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash("hashed-token");
        token.setExpiresAt(Instant.parse("2026-04-02T01:00:00Z"));
        when(passwordResetTokenRepository.findByTokenHash(any(String.class))).thenReturn(Optional.of(token));
        when(passwordResetTokenRepository.findActiveTokensForUser(42L, Instant.parse("2026-04-02T00:00:00Z")))
                .thenReturn(List.of(token));
        when(clock.instant()).thenReturn(Instant.parse("2026-04-02T00:00:00Z"));
        when(passwordEncoder.matches("next-secret-123", "hashed-password")).thenReturn(false);
        when(passwordEncoder.encode("next-secret-123")).thenReturn("re-hashed-password");

        authFacade.resetPassword(new ResetPasswordRequest("raw-token", "next-secret-123"), "10.0.0.5");

        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals("re-hashed-password", user.getPasswordHash());
    }

    private AppUser buildUser(UserStatus status) {
        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", 42L);
        user.setEmail("ops@example.com");
        user.setFirstName("Alex");
        user.setLastName("Morgan");
        user.setPasswordHash("hashed-password");
        user.setStatus(status);
        user.setRoles(Set.of(RoleName.ROLE_PLATFORM_ADMIN));
        return user;
    }
}