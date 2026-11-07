package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("notificationDelivery")
public class NotificationDeliveryHealthIndicator implements HealthIndicator {

    private final NotificationRepository notificationRepository;

    public NotificationDeliveryHealthIndicator(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public Health health() {
        long terminalEmailFailureCount = notificationRepository
                .countByChannelAndDeliveryStatusAndNextDeliveryAttemptAtIsNullAndStatus(
                        NotificationChannel.EMAIL,
                        NotificationDeliveryStatus.FAILED,
                        NotificationStatus.ACTIVE);
        return Health.up()
                .withDetail("terminalEmailFailureCount", terminalEmailFailureCount)
                .build();
    }
}