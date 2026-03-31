package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.api.request.NotificationTemplateUpsertRequest;
import com.transportplatform.tms.features.notification.api.response.NotificationDetailResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationSummaryResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationTemplateDetailResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationTemplateSummaryResponse;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationSummaryResponse toSummary(Notification notification) {
        return new NotificationSummaryResponse(
                notification.getId(),
                notification.getNotificationCode(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getNotificationType(),
                notification.getChannel(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.getDeliveryStatus(),
                notification.getReadStatus(),
                notification.getSentAt(),
                notification.getReadAt(),
                notification.getStatus(),
                notification.getCreatedAt());
    }

    public NotificationDetailResponse toDetail(Notification notification) {
        return new NotificationDetailResponse(
                notification.getId(),
                notification.getTenantId(),
                notification.getNotificationCode(),
                notification.getRecipientUserId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getNotificationType(),
                notification.getChannel(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.getDeliveryStatus(),
                notification.getReadStatus(),
                notification.getSentAt(),
                notification.getReadAt(),
                notification.getErrorMessage(),
                notification.getMetadataJson(),
                notification.getStatus(),
                notification.getCreatedBy(),
                notification.getCreatedAt(),
                notification.getUpdatedBy(),
                notification.getUpdatedAt());
    }

    public void apply(NotificationTemplate template, NotificationTemplateUpsertRequest request) {
        template.setName(request.name().trim());
        template.setEventType(request.eventType());
        template.setChannel(request.channel());
        template.setSubjectTemplate(trimToNull(request.subjectTemplate()));
        template.setTitleTemplate(trimToNull(request.titleTemplate()));
        template.setBodyTemplate(request.bodyTemplate().trim());
        template.setDescription(trimToNull(request.description()));
        template.setDefaultTemplate(Boolean.TRUE.equals(request.isDefault()));
    }

    public NotificationTemplateSummaryResponse toTemplateSummary(NotificationTemplate template) {
        return new NotificationTemplateSummaryResponse(
                template.getId(),
                template.getTenantId(),
                template.getTemplateCode(),
                template.getName(),
                template.getEventType(),
                template.getChannel(),
                template.isDefaultTemplate(),
                template.getStatus(),
                template.getCreatedBy(),
                template.getCreatedAt(),
                template.getUpdatedBy(),
                template.getUpdatedAt());
    }

    public NotificationTemplateDetailResponse toTemplateDetail(NotificationTemplate template) {
        return new NotificationTemplateDetailResponse(
                template.getId(),
                template.getTenantId(),
                template.getTemplateCode(),
                template.getName(),
                template.getEventType(),
                template.getChannel(),
                template.getSubjectTemplate(),
                template.getTitleTemplate(),
                template.getBodyTemplate(),
                template.getDescription(),
                template.isDefaultTemplate(),
                template.getStatus(),
                template.getCreatedBy(),
                template.getCreatedAt(),
                template.getUpdatedBy(),
                template.getUpdatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}