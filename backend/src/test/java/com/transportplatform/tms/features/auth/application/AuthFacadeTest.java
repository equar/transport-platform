package com.transportplatform.tms.features.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

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
    private AuthSessionService authSessionService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private Clock clock;

    @InjectMocks
    private AuthFacade authFacade;

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
