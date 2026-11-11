package com.transportplatform.tms.features.notification.application;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
/** Re-evaluate current membership at delivery time; queued jobs are not authorization grants. */
@Component
public class NotificationDeliveryAccess {
    private final AppUserRepository users;
    private final TenantRepository tenants;
    private final com.transportplatform.tms.features.saas.application.TenantModulePolicy modules;
    private final CompanyApplicationRepository applications;
    public NotificationDeliveryAccess(AppUserRepository users, TenantRepository tenants, com.transportplatform.tms.features.saas.application.TenantModulePolicy modules, CompanyApplicationRepository applications) { this.users = users; this.tenants = tenants; this.modules = modules; this.applications = applications; }
    @Transactional(readOnly = true)
    public Optional<AppUser> recipient(Notification notification) {
        if (notification.getRecipientUserId() == null) return Optional.empty();
        boolean approvalEmail = notification.getTenantId() != null
                && notification.getChannel() == NotificationChannel.EMAIL
                && notification.getNotificationType() == NotificationType.COMPANY_APPLICATION_APPROVED
                && applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus(
                        notification.getTenantId(), notification.getRecipientUserId(), CompanyApplicationStatus.APPROVED);
        if (notification.getTenantId() != null) {
            TenantStatus status = tenants.findById(notification.getTenantId()).map(Tenant::getStatus).orElse(null);
            if (status != TenantStatus.ACTIVE && !(approvalEmail && status == TenantStatus.PENDING)) {
                return Optional.empty();
            }
            if (!approvalEmail) {
                try { modules.requireEnabled(notification.getTenantId(), "NOTIFICATIONS"); }
                catch (com.transportplatform.tms.common.exception.ApiException disabled) { return Optional.empty(); }
            }
        }
        return users.findByIdAndTenantId(notification.getRecipientUserId(), notification.getTenantId())
                .filter(AppUser::isActiveForLogin)
                .filter(user -> Objects.equals(user.getTenantId(), notification.getTenantId()));
    }
}
