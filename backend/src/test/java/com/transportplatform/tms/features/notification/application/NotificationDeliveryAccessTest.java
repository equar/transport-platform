package com.transportplatform.tms.features.notification.application;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class NotificationDeliveryAccessTest {
    @Test void queuedDeliveryRechecksTenantAndRecipientMembership() {
        var users = mock(AppUserRepository.class); var tenants = mock(TenantRepository.class);
        var policy = new NotificationDeliveryAccess(users, tenants, mock(com.transportplatform.tms.features.saas.application.TenantModulePolicy.class), mock(CompanyApplicationRepository.class));
        var notification = new Notification(); notification.setTenantId("a"); notification.setRecipientUserId(7L);
        var tenant = new Tenant(); tenant.setStatus(TenantStatus.ACTIVE);
        when(tenants.findById("a")).thenReturn(Optional.of(tenant));
        var user = new AppUser(); user.setTenantId("a"); user.setStatus(UserStatus.ACTIVE);
        when(users.findByIdAndTenantId(7L,"a")).thenReturn(Optional.of(user));
        assertTrue(policy.recipient(notification).isPresent());
        user.setTenantId("b"); assertTrue(policy.recipient(notification).isEmpty());
        user.setTenantId("a"); user.setStatus(UserStatus.SUSPENDED); assertTrue(policy.recipient(notification).isEmpty());
        user.setStatus(UserStatus.ACTIVE); tenant.setStatus(TenantStatus.SUSPENDED); assertTrue(policy.recipient(notification).isEmpty());
    }
    @Test void approvalEmailCanReachTheApprovedOwnerWhileTenantIsPending() {
        var users = mock(AppUserRepository.class);
        var tenants = mock(TenantRepository.class);
        var modules = mock(com.transportplatform.tms.features.saas.application.TenantModulePolicy.class);
        var applications = mock(CompanyApplicationRepository.class);
        var policy = new NotificationDeliveryAccess(users, tenants, modules, applications);
        var tenant = new Tenant(); tenant.setStatus(TenantStatus.PENDING);
        when(tenants.findById("a")).thenReturn(Optional.of(tenant));
        var user = new AppUser(); user.setTenantId("a"); user.setStatus(UserStatus.ACTIVE);
        when(users.findByIdAndTenantId(7L, "a")).thenReturn(Optional.of(user));
        when(applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus("a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(true);
        var notification = new Notification(); notification.setTenantId("a"); notification.setRecipientUserId(7L);
        notification.setChannel(NotificationChannel.EMAIL);
        notification.setNotificationType(NotificationType.COMPANY_APPLICATION_APPROVED);
        assertTrue(policy.recipient(notification).isPresent());
        verifyNoInteractions(modules);
        tenant.setStatus(TenantStatus.SUSPENDED);
        assertTrue(policy.recipient(notification).isEmpty());
        tenant.setStatus(TenantStatus.PENDING);
        user.setStatus(UserStatus.SUSPENDED);
        assertTrue(policy.recipient(notification).isEmpty());
        user.setStatus(UserStatus.ACTIVE);
        notification.setNotificationType(NotificationType.RIDE_ASSIGNED_TO_DRIVER);
        assertTrue(policy.recipient(notification).isEmpty());
        notification.setNotificationType(NotificationType.COMPANY_APPLICATION_APPROVED);
        when(applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus("a", 7L, CompanyApplicationStatus.APPROVED))
                .thenReturn(false);
        assertTrue(policy.recipient(notification).isEmpty());
    }
}
