package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.MDC;
import com.transportplatform.tms.common.observability.RequestCorrelationFilter;

@Service
public class NotificationEmailRetryService {

    private static final int MAX_DELIVERY_ATTEMPTS = 3;
    private static final int BATCH_SIZE = 50;

    private final NotificationRepository notificationRepository;
    private final AppUserRepository appUserRepository;
    private final NotificationEmailSender notificationEmailSender;
    private final Clock clock;

    public NotificationEmailRetryService(NotificationRepository notificationRepository,
            AppUserRepository appUserRepository,
            NotificationEmailSender notificationEmailSender,
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.appUserRepository = appUserRepository;
        this.notificationEmailSender = notificationEmailSender;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${app.notification-retry.fixed-delay:PT1M}")
    @Transactional
    public void retryDueEmailNotifications() {
        Instant now = clock.instant();
        List<Notification> notifications = notificationRepository
                .findByChannelAndDeliveryStatusInAndNextDeliveryAttemptAtLessThanEqualOrderByNextDeliveryAttemptAtAsc(
                        NotificationChannel.EMAIL,
                        List.of(NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.FAILED),
                        now,
                        PageRequest.of(0, BATCH_SIZE));
        notifications.forEach(notification -> retry(notification, now));
    }

    private void retry(Notification notification, Instant now) {
        if (notification.getDeliveryAttemptCount() >= MAX_DELIVERY_ATTEMPTS) {
            notification.setNextDeliveryAttemptAt(null);
            notificationRepository.save(notification);
            return;
        }
        var recipient = appUserRepository.findByIdAndTenantId(notification.getRecipientUserId(), notification.getTenantId());
        if (recipient.isEmpty() || recipient.get().getEmail() == null || recipient.get().getEmail().isBlank()) {
            notification.setDeliveryStatus(NotificationDeliveryStatus.SKIPPED);
            notification.setErrorMessage("Recipient email is unavailable.");
            notification.setNextDeliveryAttemptAt(null);
            notificationRepository.save(notification);
            return;
        }
        NotificationEmailSender.DeliveryResult result = deliver(notification, recipient.get().getEmail().trim());
        int attempts = notification.getDeliveryAttemptCount() + 1;
        notification.setDeliveryAttemptCount(attempts);
        notification.setErrorMessage(result.errorMessage());
        if (result.sent()) {
            notification.setDeliveryStatus(NotificationDeliveryStatus.SENT);
            notification.setSentAt(now);
            notification.setNextDeliveryAttemptAt(null);
        } else {
            notification.setDeliveryStatus(NotificationDeliveryStatus.FAILED);
            notification.setNextDeliveryAttemptAt(attempts >= MAX_DELIVERY_ATTEMPTS ? null : now.plus(retryDelay(attempts)));
        }
        notificationRepository.save(notification);
    }

    private NotificationEmailSender.DeliveryResult deliver(Notification notification, String recipientEmail) {
        String correlationId = notification.getCorrelationId();
        String previousCorrelationId = MDC.get(RequestCorrelationFilter.MDC_KEY);
        if (correlationId != null && !correlationId.isBlank()) {
            MDC.put(RequestCorrelationFilter.MDC_KEY, correlationId);
        }
        try {
            return notificationEmailSender.send(
                    new NotificationEmailSender.NotificationEmailCommand(
                        recipientEmail, emailSubject(notification), notification.getTitle(), notification.getMessage()));
        } catch (RuntimeException exception) {
            return new NotificationEmailSender.DeliveryResult(false, "Email delivery provider failed.");
        } finally {
            if (previousCorrelationId == null) {
                MDC.remove(RequestCorrelationFilter.MDC_KEY);
            } else {
                MDC.put(RequestCorrelationFilter.MDC_KEY, previousCorrelationId);
            }
        }
    }

    private String emailSubject(Notification notification) {
        String subject = notification.getEmailSubject();
        return subject == null || subject.isBlank() ? notification.getTitle() : subject;
    }

    private Duration retryDelay(int completedAttempts) {
        return switch (completedAttempts) {
            case 1 -> Duration.ofMinutes(1);
            case 2 -> Duration.ofMinutes(5);
            default -> Duration.ofMinutes(15);
        };
    }
}