package com.transportplatform.tms.features.companyapplication.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.auth.application.AuthFlowProperties;
import com.transportplatform.tms.features.auth.application.AuthSessionService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.companyapplication.domain.*;
import com.transportplatform.tms.features.notification.application.NotificationDispatchService;
import com.transportplatform.tms.features.tenant.domain.*;
import java.time.*;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TenantEmailVerificationServiceTest {
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final CompanyApplicationRepository applications = mock(CompanyApplicationRepository.class);
    private final TenantRepository tenants = mock(TenantRepository.class);
    private final NotificationDispatchService dispatch = mock(NotificationDispatchService.class);
    private final AuthSessionService sessions = mock(AuthSessionService.class);
    private final AuditLogService audit = mock(AuditLogService.class);
    private final com.transportplatform.tms.features.tenant.application.TenantService tenantService =
            mock(com.transportplatform.tms.features.tenant.application.TenantService.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final Instant now = Instant.parse("2026-11-11T04:00:00Z");
    private final AppUser owner = new AppUser();
    private final Tenant tenant = new Tenant();
    private TenantEmailVerificationService service;

    @BeforeEach void setup() {
        var properties = new AuthFlowProperties();
        properties.setPasswordResetBaseUrl("https://admin.transport.bakaroo.com/reset-password");
        service = new TenantEmailVerificationService(users, applications, tenants, dispatch, properties,
                Clock.fixed(now, ZoneOffset.UTC), encoder, sessions, audit, tenantService);
        ReflectionTestUtils.setField(owner, "id", 7L);
        owner.setTenantId("tenant-a"); owner.setEmail("owner@example.test"); owner.setStatus(UserStatus.ACTIVE);
        tenant.setStatus(TenantStatus.PENDING);
        lenient().when(tenants.findById("tenant-a")).thenReturn(Optional.of(tenant));
        lenient().when(tenants.lockForDispatch("tenant-a")).thenReturn(Optional.of(tenant));
        lenient().when(applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus("tenant-a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(true);
    }

    @Test void approvalQueuesAnExpiringLinkAndPersistsOnlyItsHashOnTheUser() {
        var application = mock(CompanyApplication.class);
        when(application.getId()).thenReturn(1L);
        when(application.getApplicationNumber()).thenReturn("APP-1");
        when(application.getLegalCompanyName()).thenReturn("Transit");
        when(application.getEmailVerifiedAt()).thenReturn(now.minusSeconds(60));
        service.sendApprovalVerification(application, owner);
        assertThat(owner.getEmailVerifiedAt()).isEqualTo(now.minusSeconds(60));
        assertThat(owner.getEmailVerificationTokenHash()).hasSize(64);
        assertThat(owner.getEmailVerificationExpiresAt()).isEqualTo(now.plus(Duration.ofHours(24)));
        assertThat(owner.getEmailVerificationEmail()).isEqualTo(owner.getEmail());
        verify(dispatch).notifyEmail(eq("tenant-a"), eq(7L), eq(owner.getEmail()), any(), eq("COMPANY_APPLICATION"), eq("1"),
                anyString(), anyString(), contains("https://admin.transport.bakaroo.com/verify-email#token="), anyMap());
    }

    @Test void completedApprovedOwnerCanRecoverPendingActivation() {
        completeSetup();
        service.activateCompletedOwner(owner);
        verify(tenantService).activate("tenant-a");
    }

    @Test void incompleteOrUnverifiedOwnersCannotActivate() {
        service.activateCompletedOwner(owner);
        completeSetup();
        owner.setMustChangePassword(true);
        service.activateCompletedOwner(owner);
        owner.setMustChangePassword(false);
        owner.setPasswordChangedAt(null);
        service.activateCompletedOwner(owner);
        owner.setPasswordChangedAt(now);
        owner.setEmailVerifiedAt(null);
        service.activateCompletedOwner(owner);
        owner.setEmailVerifiedAt(now);
        owner.setEmailVerificationEmail("changed@example.test");
        service.activateCompletedOwner(owner);
        verifyNoInteractions(tenantService);
    }

    @Test void suspendedOrUnapprovedOwnersAndActiveTenantsAreNotActivated() {
        completeSetup();
        owner.setStatus(UserStatus.SUSPENDED);
        service.activateCompletedOwner(owner);
        owner.setStatus(UserStatus.ACTIVE);
        tenant.setStatus(TenantStatus.SUSPENDED);
        service.activateCompletedOwner(owner);
        tenant.setStatus(TenantStatus.ACTIVE);
        service.activateCompletedOwner(owner);
        tenant.setStatus(TenantStatus.PENDING);
        when(applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus("tenant-a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(false);
        service.activateCompletedOwner(owner);
        verifyNoInteractions(tenantService);
    }

    @Test void verifiedApplicantAwaitingPasswordCanResendSetupLink() {
        completeSetup();
        owner.setMustChangePassword(true);
        var application = new CompanyApplication();
        ReflectionTestUtils.setField(application, "id", 1L);
        application.setApplicationNumber("APP-1");
        application.setLegalCompanyName("Transit");
        application.setEmailVerifiedAt(now);
        when(users.findByEmailIgnoreCase(owner.getEmail())).thenReturn(Optional.of(owner));
        when(applications.findFirstByApprovedTenantIdAndOwnerUserIdAndStatus("tenant-a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(Optional.of(application));
        service.resend(owner.getEmail());
        verify(dispatch).notifyEmail(anyString(), anyLong(), anyString(), any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyMap());
    }

    private void completeSetup() {
        owner.setEmailVerifiedAt(now);
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setPasswordChangedAt(now);
        owner.setMustChangePassword(false);
    }

    @Test void passwordSetupConsumesTheTokenAndActivatesTheApprovedTenant() {
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerificationExpiresAt(now.plusSeconds(60));
        owner.setEmailVerificationTokenHash("stored-hash");
        owner.setMustChangePassword(true);
        owner.setTemporaryPasswordExpiresAt(now.minusSeconds(60));
        owner.setPasswordResetTokenHash("old-reset");
        owner.setPasswordResetTokenExpiresAt(now.plusSeconds(60));
        owner.setPasswordResetRequestedAt(now);
        when(users.findByEmailVerificationTokenHash(anyString())).thenReturn(Optional.of(owner), Optional.empty());
        assertThat(service.verify("token", "My-new-password")).contains("password is created");
        assertThat(encoder.matches("My-new-password", owner.getPasswordHash())).isTrue();
        assertThat(owner.getPasswordHash()).isNotEqualTo("My-new-password");
        assertThat(owner.getPasswordChangedAt()).isEqualTo(now);
        assertThat(owner.isMustChangePassword()).isFalse();
        assertThat(owner.getTemporaryPasswordExpiresAt()).isNull();
        assertThat(owner.getPasswordResetTokenHash()).isNull();
        assertThat(owner.getPasswordResetTokenExpiresAt()).isNull();
        assertThat(owner.getPasswordResetRequestedAt()).isNull();
        assertThat(owner.getEmailVerifiedAt()).isEqualTo(now);
        assertThat(owner.getEmailVerificationTokenHash()).isNull();
        verify(tenantService).activate("tenant-a");
        assertThatThrownBy(() -> service.verify("token", "Other-password")).isInstanceOf(ApiException.class);
        verify(sessions).revokeAllForUser(7L);
        verify(audit).record(any());
    }

    @Test void expiredChangedEmailAndSuspendedTenantAreRejected() {
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerificationExpiresAt(now);
        when(users.findByEmailVerificationTokenHash(anyString())).thenReturn(Optional.of(owner));
        assertThatThrownBy(() -> service.verify("token", "My-new-password")).isInstanceOf(ApiException.class);
        owner.setEmailVerificationExpiresAt(now.plusSeconds(60));
        owner.setEmailVerificationEmail("old@example.test");
        assertThatThrownBy(() -> service.verify("token", "My-new-password")).isInstanceOf(ApiException.class);
        owner.setEmailVerificationEmail(owner.getEmail());
        tenant.setStatus(TenantStatus.SUSPENDED);
        assertThatThrownBy(() -> service.verify("token", "My-new-password")).isInstanceOf(ApiException.class);
        assertThat(owner.getEmailVerifiedAt()).isNull();
        verify(users, never()).save(any());
        verifyNoInteractions(sessions, audit);
    }

    @Test void resendIsGenericAndThrottled() {
        when(users.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty(), Optional.of(owner));
        String unknown = service.resend("unknown@example.test");
        owner.setEmailVerificationRequestedAt(now);
        assertThat(service.resend(owner.getEmail())).isEqualTo(unknown);
        verifyNoInteractions(dispatch);
    }

    @Test void resendReplacesOldTokenButDoesNotResetAnAlreadyVerifiedEmail() {
        var application = mock(CompanyApplication.class);
        when(application.getId()).thenReturn(1L);
        when(application.getApplicationNumber()).thenReturn("APP-1");
        when(application.getLegalCompanyName()).thenReturn("Transit");
        when(users.findByEmailIgnoreCase(owner.getEmail())).thenReturn(Optional.of(owner));
        when(applications.findFirstByApprovedTenantIdAndOwnerUserIdAndStatus("tenant-a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(Optional.of(application));
        owner.setEmailVerificationTokenHash("old-hash");
        owner.setEmailVerificationRequestedAt(now.minus(Duration.ofMinutes(5)));
        service.resend(owner.getEmail());
        assertThat(owner.getEmailVerificationTokenHash()).hasSize(64).isNotEqualTo("old-hash");
        assertThat(owner.getEmailVerificationRequestedAt()).isEqualTo(now);
        clearInvocations(dispatch);
        owner.setEmailVerifiedAt(now);
        owner.setEmailVerificationRequestedAt(now.minus(Duration.ofMinutes(5)));
        service.resend(owner.getEmail());
        verifyNoInteractions(dispatch);
        assertThat(owner.getEmailVerifiedAt()).isEqualTo(now);
    }

    @Test void unrelatedOwnerAndInactiveAccountCannotVerify() {
        when(users.findByEmailVerificationTokenHash(anyString())).thenReturn(Optional.of(owner));
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerificationExpiresAt(now.plusSeconds(60));
        when(applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus("tenant-a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(false);
        assertThatThrownBy(() -> service.verify("token", "My-new-password")).isInstanceOf(ApiException.class);
        owner.setStatus(UserStatus.SUSPENDED);
        assertThatThrownBy(() -> service.verify("token", "My-new-password")).isInstanceOf(ApiException.class);
        verify(users, never()).save(any());
    }

    @Test void invalidPasswordsDoNotConsumeTheLinkOrChangeTheAccount() {
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerificationExpiresAt(now.plusSeconds(60));
        owner.setEmailVerificationTokenHash("stored-hash");
        owner.setPasswordHash("old-password-hash");
        when(users.findByEmailVerificationTokenHash(anyString())).thenReturn(Optional.of(owner));
        for (String password : new String[] { "", "short", " ".repeat(8), "x".repeat(101), "\u00e9".repeat(37) }) {
            assertThatThrownBy(() -> service.verify("token", password)).isInstanceOf(ApiException.class);
        }
        assertThat(owner.getEmailVerificationTokenHash()).isEqualTo("stored-hash");
        assertThat(owner.getPasswordHash()).isEqualTo("old-password-hash");
        assertThat(owner.getEmailVerifiedAt()).isNull();
        verify(users, never()).save(any());
        verifyNoInteractions(sessions, audit);
    }
}
