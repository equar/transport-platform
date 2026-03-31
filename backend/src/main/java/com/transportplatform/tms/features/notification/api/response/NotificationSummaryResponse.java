package com.transportplatform.tms.features.notification.api.response;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import java.time.Instant;

public record NotificationSummaryResponse(
        Long id,
        String notificationCode,
        String title,
        String message,
        NotificationType notificationType,
        NotificationChannel channel,
        String relatedEntityType,
        String relatedEntityId,
        NotificationDeliveryStatus deliveryStatus,
        NotificationReadStatus readStatus,
        Instant sentAt,
        Instant readAt,
        NotificationStatus status,
        Instant createdAt) {
}