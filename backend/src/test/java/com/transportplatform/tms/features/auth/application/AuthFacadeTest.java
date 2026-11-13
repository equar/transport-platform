package com.transportplatform.tms.features.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.JwtClaims;
import com.transportplatform.tms.common.security.JwtService;
import com.transportplatform.tms.features.auth.api.request.LoginRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.time.Clock;
import java.time.Instant;
import java.util.Set;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthFacadeTest {

    @ParameterizedTest
    @EnumSource(value = RoleName.class, names = {"ROLE_DRIVER", "ROLE_RIDER", "ROLE_GUARDIAN"})
    void mobileRolesCannotLoginOnWeb(RoleName role) {
        AppUser user = activeTenantUser(role);
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        ApiException error = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertTrue(error.getMessage().contains("mobile app"));
        verify(authSessionService, never()).issue(any(), any());
        verify(jwtService, never()).generateAccessToken(any());
    }

    @ParameterizedTest
    @EnumSource(value = RoleName.class, names = {"ROLE_DRIVER", "ROLE_RIDER", "ROLE_GUARDIAN"})
    void legacyWebSessionsAreRevokedWithoutRevokingMobileSessions(RoleName role) {
        AppUser user = activeTenantUser(role);
        when(authSessionService.rotate("old-refresh", "WEB")).thenReturn(
                new AuthSessionService.RotatedRefreshToken(user,
                        new AuthSessionService.IssuedRefreshToken("replacement", Instant.now(), "WEB")));
        ApiException error = assertThrows(ApiException.class, () -> authFacade.refresh("old-refresh", "WEB"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        verify(authSessionService).revokeWebForUser(42L);
        verify(authSessionService, never()).revokeAllForUser(any());
        verify(jwtService, never()).generateAccessToken(any());
    }

    @ParameterizedTest
    @EnumSource(value = RoleName.class, names = {"ROLE_DRIVER", "ROLE_RIDER", "ROLE_GUARDIAN",
            "ROLE_TENANT_ADMIN", "ROLE_DISPATCHER", "ROLE_BILLING_ADMIN", "ROLE_COMPLIANCE_ADMIN", "ROLE_ORGANIZATION_USER"})
    void supportedClientsStillLoginAndRefresh(RoleName role) {
        AppUser user = activeTenantUser(role);
        String client = Set.of(RoleName.ROLE_DRIVER, RoleName.ROLE_RIDER, RoleName.ROLE_GUARDIAN).contains(role) ? "MOBILE" : "WEB";
        when(clock.instant()).thenReturn(Instant.parse("2026-11-11T05:00:00Z"));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        var token = new AuthSessionService.IssuedRefreshToken("refresh", Instant.now(), client);
        when(authSessionService.issue(user, client)).thenReturn(token);
        when(authSessionService.rotate("refresh", client)).thenReturn(new AuthSessionService.RotatedRefreshToken(user, token));
        when(jwtService.generateAccessToken(any())).thenReturn("access");
        when(jwtService.parseAccessToken("access")).thenReturn(new JwtClaims(42L, user.getEmail(), "Alex", "Morgan",
                "tenant-a", Set.of(role.name()), false, "ACCESS", Instant.parse("2026-11-11T05:00:00Z"),
                Instant.parse("2026-11-11T05:15:00Z")));
        assertEquals("access", authFacade.login(new LoginRequest("ops@example.com", "secret123"), client).accessToken());
        assertEquals("access", authFacade.refresh("refresh", client).accessToken());
        verify(authSessionService, never()).revokeWebForUser(any());
    }

    private AppUser activeTenantUser(RoleName role) {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-a");
        user.setRoles(Set.of(role));
        Tenant tenant = new Tenant();
        tenant.setStatus(TenantStatus.ACTIVE);
        lenient().when(tenantRepository.findById("tenant-a")).thenReturn(Optional.of(tenant));
        return user;
    }

    @Test
    void addingAnAdminRoleDoesNotEnableWebLoginForAMobileAccount() {
        AppUser user = activeTenantUser(RoleName.ROLE_DRIVER);
        user.setRoles(Set.of(RoleName.ROLE_DRIVER, RoleName.ROLE_TENANT_ADMIN));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        ApiException error = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        verify(authSessionService, never()).issue(any(), any());
    }

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthSessionService authSessionService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private Clock clock;

    @Mock
    private com.transportplatform.tms.features.companyapplication.application.TenantEmailVerificationService onboarding;

    @Mock
    private MfaService mfa;

    @InjectMocks
    private AuthFacade authFacade;

    @org.junit.jupiter.api.BeforeEach
    void injectMfaService() {
        ReflectionTestUtils.setField(authFacade, "mfa", mfa);
    }

    @Test
    void completedApprovedOwnerCanLoginAfterPendingWorkspaceRecovery() {
        AppUser user = activeTenantUser(RoleName.ROLE_TENANT_ADMIN);
        Tenant tenant = new Tenant();
        tenant.setStatus(TenantStatus.PENDING);
        when(tenantRepository.findById("tenant-a")).thenReturn(Optional.of(tenant));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        doAnswer(invocation -> { tenant.setStatus(TenantStatus.ACTIVE); return null; })
                .when(onboarding).activateCompletedOwner(user);
        Instant now = Instant.parse("2026-11-11T05:00:00Z");
        when(clock.instant()).thenReturn(now);
        when(authSessionService.issue(user, "WEB")).thenReturn(
                new AuthSessionService.IssuedRefreshToken("refresh", now.plusSeconds(3600), "WEB"));
        when(jwtService.generateAccessToken(any())).thenReturn("access");
        when(jwtService.parseAccessToken("access")).thenReturn(new JwtClaims(42L, user.getEmail(), "Alex", "Morgan",
                "tenant-a", Set.of(RoleName.ROLE_TENANT_ADMIN.name()), false, "ACCESS", now, now.plusSeconds(900)));
        assertEquals("access", authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB").accessToken());
        verify(onboarding).activateCompletedOwner(user);
    }

    @Test
    void incompletePendingOwnerStillCannotLogin() {
        AppUser user = activeTenantUser(RoleName.ROLE_TENANT_ADMIN);
        Tenant tenant = new Tenant();
        tenant.setStatus(TenantStatus.PENDING);
        when(tenantRepository.findById("tenant-a")).thenReturn(Optional.of(tenant));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        ApiException error = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));
        assertTrue(error.getMessage().contains("company account is not active"));
        verify(authSessionService, never()).issue(any(), any());
    }

    @Test
    void mobileOnlyWebRefreshCannotActivatePendingTenant() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-a");
        user.setRoles(Set.of(RoleName.ROLE_DRIVER, RoleName.ROLE_TENANT_ADMIN));
        when(authSessionService.rotate("old-refresh", "WEB")).thenReturn(
                new AuthSessionService.RotatedRefreshToken(user,
                        new AuthSessionService.IssuedRefreshToken("replacement", Instant.now(), "WEB")));
        assertThrows(ApiException.class, () -> authFacade.refresh("old-refresh", "WEB"));
        verify(onboarding, never()).activateCompletedOwner(any());
        verify(authSessionService).revokeWebForUser(42L);
    }

    @Test
    void loginRejectsExpiredTemporaryPassword() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setMustChangePassword(true);
        user.setTemporaryPasswordExpiresAt(Instant.parse("2026-11-06T12:00:00Z"));
        when(clock.instant()).thenReturn(Instant.parse("2026-11-06T12:00:00Z"));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        assertThrows(ApiException.class, () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));
        verify(authSessionService, never()).issue(any(), any());
    }

    @Test
    void loginRejectsNonActiveUsers() {
        AppUser user = buildUser(UserStatus.SUSPENDED);
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    @Test
    void loginReturnsRicherIdentityPayload() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        when(clock.instant()).thenReturn(Instant.parse("2025-01-01T00:00:00Z"));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
        when(jwtService.generateAccessToken(org.mockito.ArgumentMatchers.any(AuthenticatedUser.class)))
                .thenReturn("access");
        when(authSessionService.issue(user, "WEB")).thenReturn(new AuthSessionService.IssuedRefreshToken(
                "refresh", Instant.parse("2025-01-08T00:00:00Z"), "WEB"));
        when(jwtService.parseAccessToken("access")).thenReturn(new JwtClaims(
                42L,
                "ops@example.com",
                "Alex",
                "Morgan",
                null,
                Set.of(RoleName.ROLE_PLATFORM_ADMIN.name()),
                false,
                "ACCESS",
                Instant.parse("2025-01-01T00:00:00Z"),
                Instant.parse("2025-01-01T00:15:00Z")));

        AuthTokensResponse response = authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB");

        assertEquals(42L, response.user().id());
        assertEquals("Alex", response.user().firstName());
        assertEquals(UserStatus.ACTIVE.name(), response.user().status());
    }

    @Test
    void loginResolvesTenantAccountByGloballyUniqueEmail() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-uuid");
        user.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        Tenant tenant = new Tenant();
        tenant.setId("tenant-uuid");
        tenant.setStatus(TenantStatus.ACTIVE);
        when(appUserRepository.findForAuthenticationByEmail("owner@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("owner@example.com", "wrong-password"), "WEB"));

        verify(appUserRepository).findForAuthenticationByEmail("owner@example.com");
    }

    @Test
    void loginRejectsUserWhenTenantIsNotActive() {
        Tenant tenant = new Tenant();
        tenant.setId("tenant-uuid");
        tenant.setStatus(TenantStatus.PENDING);
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setTenantId("tenant-uuid");
        user.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        when(tenantRepository.findById("tenant-uuid")).thenReturn(Optional.of(tenant));
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void loginRejectsUnknownEmailBeforeCheckingPassword() {
        when(appUserRepository.findForAuthenticationByEmail("ops@example.com"))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.login(new LoginRequest("ops@example.com", "secret123"), "WEB"));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        verify(passwordEncoder, org.mockito.Mockito.never()).matches(
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void refreshRejectsUsersWithoutRolesAndRevokesSessions() {
        AppUser user = buildUser(UserStatus.ACTIVE);
        user.setRoles(Set.of());
        AuthSessionService.IssuedRefreshToken replacement = new AuthSessionService.IssuedRefreshToken(
                "replacement-refresh", Instant.parse("2025-01-08T00:00:00Z"), "WEB");
        when(authSessionService.rotate("old-refresh", "WEB"))
                .thenReturn(new AuthSessionService.RotatedRefreshToken(user, replacement));

        ApiException exception = assertThrows(ApiException.class,
                () -> authFacade.refresh("old-refresh", "WEB"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(authSessionService).revokeAllForUser(42L);
        verify(jwtService, never()).generateAccessToken(any());
    }

    @Test
        void toPrincipalUsesLockedFieldForAccountNonLocked() {
        AppUser user = buildUser(UserStatus.ACTIVE);
                ReflectionTestUtils.setField(user, "locked", true);

                AuthenticatedUser principal = ReflectionTestUtils.invokeMethod(authFacade, "toPrincipal", user);

                assertTrue(principal.isEnabled());
                assertFalse(principal.isAccountNonLocked());
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
