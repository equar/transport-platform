package com.transportplatform.tms.features.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.features.notification.domain.*;
import java.time.Clock;
import java.util.Map;
import org.junit.jupiter.api.Test;

class NotificationDispatchServiceTest {
    @Test void customApprovalTemplatesCannotOmitVerificationLink() {
        var notifications = mock(NotificationRepository.class);
        var renderer = mock(NotificationTemplateRenderer.class);
        var generator = mock(NotificationCodeGenerator.class);
        var dispatch = new NotificationDispatchService(notifications, mock(NotificationTemplateRepository.class),
                generator, renderer, mock(PushDeliveryWorker.class), mock(PortalPushDeviceTokenService.class),
                new ObjectMapper(), Clock.systemUTC());
        when(generator.generate("tenant-a")).thenReturn("NOT-1");
        when(renderer.render(any(), anyMap(), anyString(), anyString(), anyString()))
                .thenReturn(new NotificationTemplateRenderer.RenderedTemplate("Approved", "Approved", "Custom approval message" + "x".repeat(3977)));
        when(notifications.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        String url = "https://admin.transport.bakaroo.com/verify-email#token=test";
        var email = dispatch.notifyEmail("tenant-a", 7L, "owner@example.test",
                NotificationType.COMPANY_APPLICATION_APPROVED, "COMPANY_APPLICATION", "1",
                "Approved", "Approved", "Verify your email: " + url, Map.of("verificationUrl", url));
        assertThat(email.getMessage()).contains("Custom approval message", url);
        assertThat(email.getMessage()).hasSizeLessThanOrEqualTo(4000);
        assertThat(email.getDeliveryStatus()).isEqualTo(NotificationDeliveryStatus.PENDING);
    }
}
