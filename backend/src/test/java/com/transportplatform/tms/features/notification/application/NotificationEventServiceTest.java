package com.transportplatform.tms.features.notification.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class NotificationEventServiceTest {

    @Mock
    private NotificationDispatchService notificationDispatchService;

    @Mock
    private NotificationEmailSender notificationEmailSender;

    @Mock
    private com.transportplatform.tms.features.auth.domain.AppUserRepository appUserRepository;

    @Test
    void publishUserInvitationUsesTemplateBackedDispatchForTenantUsers() {
        NotificationEventService service = new NotificationEventService(
                notificationDispatchService,
                notificationEmailSender,
                appUserRepository);

        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", 44L);
        user.setTenantId("tenant-123");
        user.setEmail("invited@example.com");
        user.setFirstName("Taylor");
        user.setLastName("Lee");
        Notification notification = new Notification();
        notification.setDeliveryStatus(NotificationDeliveryStatus.SENT);
        org.mockito.Mockito.when(notificationDispatchService.notifyEmail(
                eq("tenant-123"),
                eq(44L),
                eq("invited@example.com"),
                eq(NotificationType.USER_INVITATION),
                eq("USER"),
                eq("44"),
                eq("Set up your workspace account"),
                eq("Complete your account setup"),
                eq("Your workspace account is ready. Use this secure link to choose your password and activate access: https://app.example/reset?token=abc"),
                any())).thenReturn(notification);

        var result = service.publishUserInvitation(user, "https://app.example/reset?token=abc");

        verify(notificationDispatchService).notifyEmail(
                eq("tenant-123"),
                eq(44L),
                eq("invited@example.com"),
                eq(NotificationType.USER_INVITATION),
                eq("USER"),
                eq("44"),
                eq("Set up your workspace account"),
                eq("Complete your account setup"),
                eq("Your workspace account is ready. Use this secure link to choose your password and activate access: https://app.example/reset?token=abc"),
                any());
        verify(notificationEmailSender, never()).send(any());
        assertEquals(NotificationDeliveryStatus.SENT, result.deliveryStatus());
    }

    @Test
    void publishUserInvitationFallsBackToDirectEmailForPlatformUsers() {
        NotificationEventService service = new NotificationEventService(
                notificationDispatchService,
                notificationEmailSender,
                appUserRepository);

        AppUser user = new AppUser();
        user.setEmail("platform-admin@example.com");
        user.setFirstName("Platform");
        user.setLastName("Admin");
        org.mockito.Mockito.when(notificationEmailSender.send(any()))
                .thenReturn(new NotificationEmailSender.DeliveryResult(false, "Mailbox rejected"));

        var result = service.publishUserInvitation(user, "https://app.example/reset?token=xyz");

        verify(notificationEmailSender).send(any());
        verify(notificationDispatchService, never()).notifyEmail(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
        assertEquals(NotificationDeliveryStatus.FAILED, result.deliveryStatus());
        assertEquals("Mailbox rejected", result.errorMessage());
    }
}