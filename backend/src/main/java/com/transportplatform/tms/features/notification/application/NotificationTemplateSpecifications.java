package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import org.springframework.data.jpa.domain.Specification;

public final class NotificationTemplateSpecifications {

    private NotificationTemplateSpecifications() {
    }

    public static Specification<NotificationTemplate> search(String tenantId,
            String keyword,
            NotificationTemplateStatus status,
            NotificationType eventType,
            NotificationChannel channel) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            predicate = builder.and(predicate, builder.equal(root.get("tenantId"), tenantId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("templateCode")), pattern),
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern),
                        builder.like(builder.lower(root.get("eventType").as(String.class)), pattern)));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (eventType != null) {
                predicate = builder.and(predicate, builder.equal(root.get("eventType"), eventType));
            }
            if (channel != null) {
                predicate = builder.and(predicate, builder.equal(root.get("channel"), channel));
            }
            return predicate;
        };
    }
}