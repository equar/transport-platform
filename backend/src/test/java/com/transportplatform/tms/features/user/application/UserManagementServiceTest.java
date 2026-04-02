package com.transportplatform.tms.features.user.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.application.AuthFacade;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.saas.application.SubscriptionEnforcementService;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.user.api.request.UserUpsertRequest;
import java.util.List;
import java.util.Optional;
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
    private AuthFacade authFacade;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationEventService notificationEventService;

    @Mock
    private PortalAccessService portalAccessService;

    @Mock
    private SubscriptionEnforcementService subscriptionEnforcementService;

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
        verify(subscriptionEnforcementService).requireUserCreationAllowed("tenant-123");
    }

    @Test
    void invitedCompanyUserCreationAllowsBlankPasswordAndSendsInvitation() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
        when(passwordEncoder.encode(org.mockito.ArgumentMatchers.anyString())).thenReturn("generated-password");
        when(appUserRepository.save(org.mockito.ArgumentMatchers.any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userManagementService.createCompanyUser(new UserUpsertRequest(
                null,
                "Taylor",
                "Lee",
                "taylor@example.com",
                "",
                UserStatus.INVITED,
                Set.of(RoleName.ROLE_TENANT_ADMIN),
                null,
                null));

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userCaptor.capture());
        assertEquals(UserStatus.INVITED, userCaptor.getValue().getStatus());
        assertEquals("generated-password", userCaptor.getValue().getPasswordHash());
        verify(authFacade).sendInvitation(userCaptor.getValue(), null);
    }

    @Test
    void companyAdminCannotReadUserFromAnotherTenant() {
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
        when(appUserRepository.findByIdAndTenantScope(99L, "tenant-123")).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class,
                () -> userManagementService.getCompanyUser(99L));

        assertEquals("RESOURCE_NOT_FOUND", exception.getErrorCode().name());
    }

    @Test
    void resendCompanyInvitationSendsInvitationForInvitedUsers() {
        AppUser user = new AppUser();
        user.setTenantId("tenant-123");
        user.setEmail("taylor@example.com");
        user.setFirstName("Taylor");
        user.setLastName("Lee");
        user.setStatus(UserStatus.INVITED);
        user.setLastInvitationSentAt(java.time.Instant.parse("2026-04-02T01:00:00Z"));
        user.setInvitationSendCount(2);
        user.setLastInvitationDeliveryStatus(
                com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus.FAILED);
        user.setLastInvitationFailureMessage("Mailbox rejected");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 33L);

        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
        when(appUserRepository.findByIdAndTenantScope(33L, "tenant-123")).thenReturn(Optional.of(user));

        var response = userManagementService.resendCompanyInvitation(33L);

        assertEquals("INVITED", response.status());
        assertEquals(java.time.Instant.parse("2026-04-02T01:00:00Z"), response.lastInvitationSentAt());
        assertEquals(2, response.invitationSendCount());
        assertEquals("FAILED", response.lastInvitationDeliveryStatus());
        assertEquals("Mailbox rejected", response.lastInvitationFailureMessage());
        verify(authFacade).sendInvitation(user, null);
    }

    @Test
    void resendCompanyInvitationRejectsActiveUsers() {
        AppUser user = new AppUser();
        user.setTenantId("tenant-123");
        user.setEmail("taylor@example.com");
        user.setFirstName("Taylor");
        user.setLastName("Lee");
        user.setStatus(UserStatus.ACTIVE);
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 33L);

        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(companyAdmin());
        when(appUserRepository.findByIdAndTenantScope(33L, "tenant-123")).thenReturn(Optional.of(user));

        ApiException exception = assertThrows(ApiException.class,
                () -> userManagementService.resendCompanyInvitation(33L));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
        verify(authFacade, never()).sendInvitation(user, null);
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
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_TENANT_ADMIN.name())));
    }
}