package com.transportplatform.tms.features.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import com.transportplatform.tms.common.observability.RequestCorrelationFilter;

@ExtendWith(MockitoExtension.class)
class NotificationEmailRetryServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private NotificationEmailSender notificationEmailSender;

    @Test
    void retrySendsDueEmailAndClearsRetrySchedule() {
        Notification notification = dueNotification(1);
        AppUser recipient = new AppUser();
        recipient.setEmail("rider@example.com");
        when(notificationRepository.findByChannelAndDeliveryStatusInAndNextDeliveryAttemptAtLessThanEqualOrderByNextDeliveryAttemptAtAsc(
                any(), any(), any(), any())).thenReturn(List.of(notification));
        when(appUserRepository.findByIdAndTenantId(7L, "tenant-123")).thenReturn(Optional.of(recipient));
        AtomicReference<String> senderCorrelationId = new AtomicReference<>();
        AtomicReference<NotificationEmailSender.NotificationEmailCommand> emailCommand = new AtomicReference<>();
        when(notificationEmailSender.send(any())).thenAnswer(invocation -> {
            senderCorrelationId.set(MDC.get(RequestCorrelationFilter.MDC_KEY));
            emailCommand.set(invocation.getArgument(0));
            return new NotificationEmailSender.DeliveryResult(true, null);
        });

        MDC.put(RequestCorrelationFilter.MDC_KEY, "worker-123");
        retryService().retryDueEmailNotifications();

        assertEquals(NotificationDeliveryStatus.SENT, notification.getDeliveryStatus());
        assertEquals(2, notification.getDeliveryAttemptCount());
        assertNull(notification.getNextDeliveryAttemptAt());
        assertEquals(Instant.parse("2026-09-03T12:00:00Z"), notification.getSentAt());
        assertEquals("request-123", senderCorrelationId.get());
        assertEquals("Your ride schedule changed", emailCommand.get().subject());
        assertEquals("worker-123", MDC.get(RequestCorrelationFilter.MDC_KEY));
        MDC.remove(RequestCorrelationFilter.MDC_KEY);
        verify(notificationRepository).save(notification);
    }

    @Test
    void retryStopsAfterThirdFailedAttempt() {
        Notification notification = dueNotification(2);
        AppUser recipient = new AppUser();
        recipient.setEmail("rider@example.com");
        when(notificationRepository.findByChannelAndDeliveryStatusInAndNextDeliveryAttemptAtLessThanEqualOrderByNextDeliveryAttemptAtAsc(
                any(), any(), any(), any())).thenReturn(List.of(notification));
        when(appUserRepository.findByIdAndTenantId(7L, "tenant-123")).thenReturn(Optional.of(recipient));
        when(notificationEmailSender.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(false, "Mail provider unavailable."));

        retryService().retryDueEmailNotifications();

        assertEquals(NotificationDeliveryStatus.FAILED, notification.getDeliveryStatus());
        assertEquals(3, notification.getDeliveryAttemptCount());
        assertNull(notification.getNextDeliveryAttemptAt());
        assertEquals("Mail provider unavailable.", notification.getErrorMessage());
    }

    private NotificationEmailRetryService retryService() {
        return new NotificationEmailRetryService(notificationRepository, appUserRepository, notificationEmailSender,
                Clock.fixed(Instant.parse("2026-09-03T12:00:00Z"), ZoneOffset.UTC));
    }

    private Notification dueNotification(int deliveryAttemptCount) {
        Notification notification = new Notification();
        notification.setTenantId("tenant-123");
        notification.setRecipientUserId(7L);
        notification.setTitle("Ride update");
        notification.setMessage("Your ride has changed.");
        notification.setEmailSubject("Your ride schedule changed");
        notification.setChannel(NotificationChannel.EMAIL);
        notification.setDeliveryStatus(NotificationDeliveryStatus.FAILED);
        notification.setDeliveryAttemptCount(deliveryAttemptCount);
        notification.setNextDeliveryAttemptAt(Instant.parse("2026-09-03T11:59:00Z"));
        notification.setCorrelationId("request-123");
        return notification;
    }
}