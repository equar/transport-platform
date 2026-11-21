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
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate db;
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.transaction.PlatformTransactionManager manager;


    private final NotificationRepository notificationRepository;
    private final NotificationDeliveryAccess deliveryAccess;
    private final NotificationEmailSender notificationEmailSender;
    private final Clock clock;

    public NotificationEmailRetryService(NotificationRepository notificationRepository,
            NotificationDeliveryAccess deliveryAccess,
            NotificationEmailSender notificationEmailSender,
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.deliveryAccess = deliveryAccess;
        this.notificationEmailSender = notificationEmailSender;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${app.notification-retry.fixed-delay:PT1M}")
    public void retryDueEmailNotifications() {
        Instant now = clock.instant();
        var ids = db.queryForList("SELECT id FROM notifications WHERE channel='EMAIL' AND delivery_status IN ('PENDING','FAILED') AND next_delivery_attempt_at<=? AND (delivery_lease_until IS NULL OR delivery_lease_until<=?) AND delivery_attempt_count<3 ORDER BY next_delivery_attempt_at LIMIT 50", Long.class, utc(now), utc(now));
        var transaction = new org.springframework.transaction.support.TransactionTemplate(manager);
        for (long id : ids) {
            String claim = java.util.UUID.randomUUID().toString();
            Notification notification = transaction.execute(status -> {
                int acquired = db.update("UPDATE notifications SET delivery_claim=?,delivery_lease_until=?,delivery_attempt_count=delivery_attempt_count+1 WHERE id=? AND delivery_status IN ('PENDING','FAILED') AND next_delivery_attempt_at<=? AND (delivery_lease_until IS NULL OR delivery_lease_until<=?) AND delivery_attempt_count<3", claim, utc(now.plusSeconds(300)), id, utc(now), utc(now));
                return acquired == 0 ? null : notificationRepository.findById(id).orElse(null);
            });
            if (notification == null) continue;
            // Provider I/O runs after the claim commits and outside a database transaction.
            retry(notification, now);
            transaction.executeWithoutResult(status -> {
                var owned=db.queryForList("SELECT id FROM notifications WHERE id=? AND delivery_claim=? FOR UPDATE", id,claim);
                if (owned.isEmpty()) return;
                var managed = notificationRepository.findById(id).orElseThrow();
                managed.setDeliveryStatus(notification.getDeliveryStatus());
                managed.setDeliveryAttemptCount(notification.getDeliveryAttemptCount());
                managed.setErrorMessage(notification.getErrorMessage());
                managed.setSentAt(notification.getSentAt());
                managed.setNextDeliveryAttemptAt(notification.getNextDeliveryAttemptAt());
                notificationRepository.saveAndFlush(managed);
                db.update("UPDATE notifications SET delivery_claim=NULL,delivery_lease_until=NULL WHERE id=? AND delivery_claim=?",id,claim);
            });
        }
        db.update("UPDATE notifications SET delivery_status='FAILED',next_delivery_attempt_at=NULL,delivery_claim=NULL,delivery_lease_until=NULL WHERE channel='EMAIL' AND delivery_status IN ('PENDING','FAILED') AND delivery_attempt_count>=3 AND delivery_lease_until<=?",utc(clock.instant()));
    }

    private void retry(Notification notification, Instant now) {
        if (notification.getDeliveryAttemptCount() > MAX_DELIVERY_ATTEMPTS) {
            notification.setNextDeliveryAttemptAt(null);

            return;
        }
        var recipient = deliveryAccess.recipient(notification);
        if (recipient.isEmpty() || recipient.get().getEmail() == null || recipient.get().getEmail().isBlank()) {
            notification.setDeliveryStatus(NotificationDeliveryStatus.SKIPPED);
            notification.setErrorMessage("Recipient access or email is no longer available.");
            notification.setNextDeliveryAttemptAt(null);

            return;
        }
        NotificationEmailSender.DeliveryResult result = deliver(notification, recipient.get().getEmail().trim());
        int attempts = notification.getDeliveryAttemptCount();
        notification.setDeliveryAttemptCount(attempts);
        notification.setErrorMessage(result.errorMessage());
        if ("DELIVERY_DISABLED".equals(result.errorMessage())) {
            notification.setDeliveryStatus(NotificationDeliveryStatus.SKIPPED);
            notification.setNextDeliveryAttemptAt(null);
        } else if (result.sent()) {
            notification.setDeliveryStatus(NotificationDeliveryStatus.SENT);
            notification.setSentAt(now);
            notification.setNextDeliveryAttemptAt(null);
        } else {
            notification.setDeliveryStatus(NotificationDeliveryStatus.FAILED);
            notification.setNextDeliveryAttemptAt(attempts >= MAX_DELIVERY_ATTEMPTS ? null : now.plus(retryDelay(attempts)));
        }

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
    private static java.time.LocalDateTime utc(Instant instant) { return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneOffset.UTC); }

}