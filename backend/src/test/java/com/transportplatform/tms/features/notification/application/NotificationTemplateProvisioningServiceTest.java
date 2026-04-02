package com.transportplatform.tms.features.notification.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateRepository;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationTemplateProvisioningServiceTest {

    @Mock
    private NotificationTemplateRepository notificationTemplateRepository;

    @Mock
    private NotificationTemplateCodeGenerator notificationTemplateCodeGenerator;

    @Test
    void provisionsInvitationTemplateWhenMissing() {
        when(notificationTemplateRepository.existsByTenantIdAndEventTypeAndChannel(
                "tenant-123",
                NotificationType.USER_INVITATION,
                NotificationChannel.EMAIL)).thenReturn(false);
        when(notificationTemplateCodeGenerator.generate("tenant-123")).thenReturn("NTM-12345678");

        NotificationTemplateProvisioningService service = new NotificationTemplateProvisioningService(
                notificationTemplateRepository,
                notificationTemplateCodeGenerator);

        service.provisionDefaults("tenant-123");

        ArgumentCaptor<NotificationTemplate> templateCaptor = ArgumentCaptor.forClass(NotificationTemplate.class);
        verify(notificationTemplateRepository).save(templateCaptor.capture());
        NotificationTemplate template = templateCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals("tenant-123", template.getTenantId());
        org.junit.jupiter.api.Assertions.assertEquals(NotificationType.USER_INVITATION, template.getEventType());
        org.junit.jupiter.api.Assertions.assertEquals(NotificationChannel.EMAIL, template.getChannel());
        org.junit.jupiter.api.Assertions.assertEquals("Set up your workspace account", template.getSubjectTemplate());
        org.junit.jupiter.api.Assertions.assertTrue(template.isDefaultTemplate());
    }

    @Test
    void skipsProvisioningWhenTemplateAlreadyExists() {
        when(notificationTemplateRepository.existsByTenantIdAndEventTypeAndChannel(
                "tenant-123",
                NotificationType.USER_INVITATION,
                NotificationChannel.EMAIL)).thenReturn(true);

        NotificationTemplateProvisioningService service = new NotificationTemplateProvisioningService(
                notificationTemplateRepository,
                notificationTemplateCodeGenerator);

        service.provisionDefaults("tenant-123");

        verify(notificationTemplateRepository, never()).save(any());
        verify(notificationTemplateCodeGenerator, never()).generate(any());
    }
}