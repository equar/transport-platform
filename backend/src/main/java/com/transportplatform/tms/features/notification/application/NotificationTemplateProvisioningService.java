package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateRepository;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationTemplateProvisioningService {

    private final NotificationTemplateRepository notificationTemplateRepository;
    private final NotificationTemplateCodeGenerator notificationTemplateCodeGenerator;

    public NotificationTemplateProvisioningService(NotificationTemplateRepository notificationTemplateRepository,
            NotificationTemplateCodeGenerator notificationTemplateCodeGenerator) {
        this.notificationTemplateRepository = notificationTemplateRepository;
        this.notificationTemplateCodeGenerator = notificationTemplateCodeGenerator;
    }

    @Transactional
    public void provisionDefaults(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        ensureUserInvitationEmailTemplate(tenantId);
    }

    private void ensureUserInvitationEmailTemplate(String tenantId) {
        if (notificationTemplateRepository.existsByTenantIdAndEventTypeAndChannel(
                tenantId,
                NotificationType.USER_INVITATION,
                NotificationChannel.EMAIL)) {
            return;
        }

        NotificationTemplate template = new NotificationTemplate();
        template.setTenantId(tenantId);
        template.setTemplateCode(notificationTemplateCodeGenerator.generate(tenantId));
        template.setName("Default user invitation email");
        template.setEventType(NotificationType.USER_INVITATION);
        template.setChannel(NotificationChannel.EMAIL);
        template.setSubjectTemplate("Set up your workspace account");
        template.setTitleTemplate("Complete your account setup");
        template.setBodyTemplate(
                "Hello {{fullName}},\n\nYour workspace account is ready. Use this secure link to choose your password and activate access:\n{{activationUrl}}\n\nIf you did not expect this invitation, you can ignore this email.");
        template.setDescription("Default email template used for tenant user invitation and onboarding links.");
        template.setDefaultTemplate(true);
        template.setStatus(NotificationTemplateStatus.ACTIVE);
        notificationTemplateRepository.save(template);
    }
}