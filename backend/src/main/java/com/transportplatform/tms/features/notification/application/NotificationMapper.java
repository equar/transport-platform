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

    private String visibleTitle(Notification n){return com.transportplatform.tms.common.privacy.PrivacyMinimizer.accountSetup(n.getNotificationType().name())?"Account setup":com.transportplatform.tms.common.privacy.PrivacyMinimizer.notificationTitle(n.getNotificationType().name());}
    private String visibleMessage(Notification n){return com.transportplatform.tms.common.privacy.PrivacyMinimizer.accountSetup(n.getNotificationType().name())?"Account setup instructions were sent by email.":com.transportplatform.tms.common.privacy.PrivacyMinimizer.NOTICE;}
    private String visibleMetadata(Notification n){if(n.getMetadataJson()==null)return null;try{var mapper=new com.fasterxml.jackson.databind.ObjectMapper();return mapper.writeValueAsString(com.transportplatform.tms.common.privacy.PrivacyMinimizer.notificationMetadata(mapper.readValue(n.getMetadataJson(),java.util.Map.class)));}catch(Exception e){return null;}}

    public NotificationSummaryResponse toSummary(Notification notification) {
        return new NotificationSummaryResponse(
                notification.getId(),
                notification.getNotificationCode(),
                visibleTitle(notification),
                visibleMessage(notification),
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
                visibleTitle(notification),
                visibleMessage(notification),
                notification.getNotificationType(),
                notification.getChannel(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.getDeliveryStatus(),
                notification.getReadStatus(),
                notification.getSentAt(),
                notification.getReadAt(),
                notification.getErrorMessage()==null?null:"Delivery failed. Review delivery status or contact support.",
                visibleMetadata(notification),
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