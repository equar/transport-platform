package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import java.time.Instant;
import org.springframework.data.jpa.domain.Specification;

public final class NotificationSpecifications {

    private NotificationSpecifications() {
    }

    public static Specification<Notification> search(String tenantId,
            Long recipientUserId,
            String keyword,
            NotificationReadStatus readStatus,
            NotificationType notificationType,
            NotificationChannel channel,
            Instant fromCreatedAt,
            Instant toCreatedAt) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            predicate = builder.and(predicate, builder.equal(root.get("recipientUserId"), recipientUserId));
            predicate = builder.and(predicate, builder.equal(root.get("status"), NotificationStatus.ACTIVE));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("message")), pattern),
                        builder.like(builder.lower(root.get("notificationCode")), pattern)));
            }
            if (readStatus != null) {
                predicate = builder.and(predicate, builder.equal(root.get("readStatus"), readStatus));
            }
            if (notificationType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("notificationType"), notificationType));
            }
            if (channel != null) {
                predicate = builder.and(predicate, builder.equal(root.get("channel"), channel));
            }
            if (fromCreatedAt != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("createdAt"), fromCreatedAt));
            }
            if (toCreatedAt != null) {
                predicate = builder.and(predicate, builder.lessThan(root.get("createdAt"), toCreatedAt));
            }
            return predicate;
        };
    }
}