package com.transportplatform.tms.features.user.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.auth.application.AuthSessionService;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.user.api.request.UserUpsertRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationEventService notificationEventService;

    @Mock
    private PortalAccessService portalAccessService;

        @Mock
        private AuthSessionService authSessionService;

    @Mock
    private Clock clock;

    @InjectMocks
    private UserManagementService userManagementService;

    @Test
    void companyAdminCannotAssignPlatformRole() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());

        ApiException exception = assertThrows(ApiException.class,
                () -> userManagementService.createCompanyUser(new UserUpsertRequest(
                        null,
                        "Taylor",
                        "Lee",
                        "taylor@example.com",
                        "secret123",
                        UserStatus.ACTIVE,
                        Set.of(RoleName.ROLE_PLATFORM_ADMIN),
                        null,
                        null)));

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    @Test
    void companyUserCreationUsesCurrentTenantScope() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
        when(clock.instant()).thenReturn(Instant.parse("2025-01-01T00:00:00Z"));
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");
        when(appUserRepository.save(org.mockito.ArgumentMatchers.any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userManagementService.createCompanyUser(new UserUpsertRequest(
                "another-tenant",
                "Taylor",
                "Lee",
                "taylor@example.com",
                "secret123",
                UserStatus.ACTIVE,
                Set.of(RoleName.ROLE_TENANT_ADMIN),
                null,
                null));

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userCaptor.capture());
        assertEquals("tenant-123", userCaptor.getValue().getTenantId());
    }

    @Test
    void portalUserCreationRequiresOperationalIdentityLink() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
        when(clock.instant()).thenReturn(Instant.parse("2025-01-01T00:00:00Z"));
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");
        when(appUserRepository.save(org.mockito.ArgumentMatchers.any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ApiException exception = assertThrows(ApiException.class,
                () -> userManagementService.createCompanyUser(new UserUpsertRequest(
                        null,
                        "Taylor",
                        "Driver",
                        "driver@example.com",
                        "secret123",
                        UserStatus.ACTIVE,
                        Set.of(RoleName.ROLE_DRIVER),
                        null,
                        null)));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
        assertEquals(
                "A portal identity must be selected for driver, rider, guardian, and organization users.",
                exception.getMessage());
    }

        @Test
        void administratorPasswordResetRevokesAllRefreshSessions() {
                AppUser user = activeUser();
                when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
                when(appUserRepository.findById(user.getId())).thenReturn(java.util.Optional.of(user));
                when(passwordEncoder.encode("new-password")).thenReturn("new-password-hash");
                when(clock.instant()).thenReturn(Instant.parse("2025-01-01T00:00:00Z"));
                when(appUserRepository.save(user)).thenReturn(user);

                userManagementService.resetCompanyUserPassword(user.getId(),
                                new com.transportplatform.tms.features.user.api.request.AdminResetPasswordRequest("new-password"));

                verify(authSessionService).revokeAllForUser(user.getId());
        }

        @Test
        void suspensionRevokesAllRefreshSessions() {
                AppUser user = activeUser();
                when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
                when(appUserRepository.findById(user.getId())).thenReturn(java.util.Optional.of(user));
                when(appUserRepository.save(user)).thenReturn(user);

                userManagementService.suspendCompanyUser(user.getId());

                verify(authSessionService).revokeAllForUser(user.getId());
        }

        @Test
        void roleChangeRevokesAllRefreshSessions() {
                AppUser user = activeUser();
                user.setRoles(Set.of(RoleName.ROLE_DISPATCHER));
                when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
                when(appUserRepository.findById(user.getId())).thenReturn(java.util.Optional.of(user));
                when(appUserRepository.existsByEmailIgnoreCaseAndIdNot(user.getEmail(), user.getId())).thenReturn(false);
                when(appUserRepository.save(user)).thenReturn(user);

                userManagementService.updateCompanyUser(user.getId(), new UserUpsertRequest(
                                null,
                                "Taylor",
                                "Driver",
                                user.getEmail(),
                                null,
                                UserStatus.ACTIVE,
                                Set.of(RoleName.ROLE_TENANT_ADMIN),
                                null,
                                null));

                verify(authSessionService).revokeAllForUser(user.getId());
        }

        private AppUser activeUser() {
                AppUser user = new AppUser();
                user.setTenantId("tenant-123");
                user.setEmail("driver@example.com");
                user.setPasswordHash("old-password-hash");
                user.setStatus(UserStatus.ACTIVE);
                org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 11L);
                return user;
        }

    private AuthenticatedUser companyAdmin() {
        return new AuthenticatedUser(
                7L,
                "tenant-123",
                "admin@tenant.example",
                "Casey",
                "Jordan",
                "password",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_TENANT_ADMIN.name())));
    }
}
