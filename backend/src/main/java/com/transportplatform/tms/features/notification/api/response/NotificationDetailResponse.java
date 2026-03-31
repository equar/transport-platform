package com.transportplatform.tms.features.notification.api.response;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import java.time.Instant;

public record NotificationDetailResponse(
        Long id,
        String tenantId,
        String notificationCode,
        Long recipientUserId,
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
        String errorMessage,
        String metadataJson,
        NotificationStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}