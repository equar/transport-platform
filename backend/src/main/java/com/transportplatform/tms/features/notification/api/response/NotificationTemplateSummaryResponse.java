package com.transportplatform.tms.features.notification.api.response;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import java.time.Instant;

public record NotificationTemplateSummaryResponse(
        Long id,
        String tenantId,
        String templateCode,
        String name,
        NotificationType eventType,
        NotificationChannel channel,
        boolean isDefault,
        NotificationTemplateStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}