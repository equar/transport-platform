package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class NotificationAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository notificationTemplateRepository;

    public NotificationAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            NotificationRepository notificationRepository,
            NotificationTemplateRepository notificationTemplateRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.notificationRepository = notificationRepository;
        this.notificationTemplateRepository = notificationTemplateRepository;
    }

    public AuthenticatedUser requireCurrentTenantUser() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        if (user.id() == null || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A tenant-scoped user account is required for notification access.");
        }
        return user;
    }

    public String requireCompanyAdminTenantId() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required for notification template access.");
        }
        return user.tenantId();
    }

    public Notification findCurrentUserNotification(Long notificationId) {
        AuthenticatedUser user = requireCurrentTenantUser();
        return notificationRepository.findByIdAndTenantIdAndRecipientUserId(notificationId, user.tenantId(), user.id())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Notification was not found."));
    }

    public NotificationTemplate findTemplateForCompanyScope(Long templateId) {
        String tenantId = requireCompanyAdminTenantId();
        return notificationTemplateRepository.findByIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Notification template was not found."));
    }
}