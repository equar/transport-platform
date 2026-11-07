package com.transportplatform.tms.features.notification.application;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.notification.domain.Notification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
/** Re-evaluate current membership at delivery time; queued jobs are not authorization grants. */
@Component
public class NotificationDeliveryAccess {
    private final AppUserRepository users;
    private final TenantRepository tenants;
    private final com.transportplatform.tms.features.saas.application.TenantModulePolicy modules;
    public NotificationDeliveryAccess(AppUserRepository users, TenantRepository tenants, com.transportplatform.tms.features.saas.application.TenantModulePolicy modules) { this.users = users; this.tenants = tenants; this.modules = modules; }
    @Transactional(readOnly = true)
    public Optional<AppUser> recipient(Notification notification) {
        if (notification.getRecipientUserId() == null) return Optional.empty();
        if (notification.getTenantId() != null) {
            try { modules.requireEnabled(notification.getTenantId(), "NOTIFICATIONS"); }
            catch (com.transportplatform.tms.common.exception.ApiException disabled) { return Optional.empty(); }
        }
        if (notification.getTenantId() != null && tenants.findById(notification.getTenantId())
                .map(t -> t.getStatus() != TenantStatus.ACTIVE).orElse(true)) return Optional.empty();
        return users.findByIdAndTenantId(notification.getRecipientUserId(), notification.getTenantId())
                .filter(AppUser::isActiveForLogin)
                .filter(user -> Objects.equals(user.getTenantId(), notification.getTenantId()));
    }
}
