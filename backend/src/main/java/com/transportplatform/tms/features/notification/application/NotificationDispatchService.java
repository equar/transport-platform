package com.transportplatform.tms.features.notification.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateRepository;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import com.transportplatform.tms.features.notification.domain.PortalPushDeviceToken;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationDispatchService {

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository notificationTemplateRepository;
    private final NotificationCodeGenerator notificationCodeGenerator;
    private final NotificationTemplateRenderer notificationTemplateRenderer;
    private final NotificationPushSender notificationPushSender;
    private final PortalPushDeviceTokenService portalPushDeviceTokenService;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public NotificationDispatchService(NotificationRepository notificationRepository,
            NotificationTemplateRepository notificationTemplateRepository,
            NotificationCodeGenerator notificationCodeGenerator,
            NotificationTemplateRenderer notificationTemplateRenderer,
            NotificationPushSender notificationPushSender,
            PortalPushDeviceTokenService portalPushDeviceTokenService,
            ObjectMapper objectMapper,
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.notificationTemplateRepository = notificationTemplateRepository;
        this.notificationCodeGenerator = notificationCodeGenerator;
        this.notificationTemplateRenderer = notificationTemplateRenderer;
        this.notificationPushSender = notificationPushSender;
        this.portalPushDeviceTokenService = portalPushDeviceTokenService;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public Notification notifyInApp(String tenantId,
            Long recipientUserId,
            NotificationType notificationType,
            String relatedEntityType,
            String relatedEntityId,
            String fallbackTitle,
            String fallbackMessage,
            Map<String, Object> context) {
        NotificationTemplate template = findActiveTemplate(tenantId, notificationType, NotificationChannel.IN_APP);
        NotificationTemplateRenderer.RenderedTemplate rendered = notificationTemplateRenderer.render(
                template,
                context,
                null,
                fallbackTitle,
                fallbackMessage);
        Notification notification = createBaseNotification(tenantId, recipientUserId, notificationType,
                NotificationChannel.IN_APP,
                relatedEntityType, relatedEntityId, rendered.title(), rendered.body(), context);
        notification.setDeliveryStatus(NotificationDeliveryStatus.SENT);
        notification.setSentAt(Instant.now(clock));
        Notification saved = notificationRepository.save(notification);
        dispatchPushNotifications(saved, context);
        return saved;
    }

    @Transactional
    public Notification notifyEmail(String tenantId,
            Long recipientUserId,
            String recipientEmail,
            NotificationType notificationType,
            String relatedEntityType,
            String relatedEntityId,
            String fallbackSubject,
            String fallbackTitle,
            String fallbackMessage,
            Map<String, Object> context) {
        NotificationTemplate template = findActiveTemplate(tenantId, notificationType, NotificationChannel.EMAIL);
        NotificationTemplateRenderer.RenderedTemplate rendered = notificationTemplateRenderer.render(
                template,
                context,
                fallbackSubject,
                fallbackTitle,
                fallbackMessage);
        Notification notification = createBaseNotification(tenantId, recipientUserId, notificationType,
                NotificationChannel.EMAIL,
                relatedEntityType, relatedEntityId, rendered.title(), rendered.body(), context);
        notification.setEmailSubject(rendered.subject());
        notification.setDeliveryStatus(NotificationDeliveryStatus.PENDING);
        notification.setNextDeliveryAttemptAt(Instant.now(clock));
        return notificationRepository.save(notification);
    }

    private Notification createBaseNotification(String tenantId,
            Long recipientUserId,
            NotificationType notificationType,
            NotificationChannel channel,
            String relatedEntityType,
            String relatedEntityId,
            String title,
            String message,
            Map<String, Object> context) {
        Notification notification = new Notification();
        notification.setTenantId(tenantId);
        notification.setNotificationCode(notificationCodeGenerator.generate(tenantId));
        notification.setRecipientUserId(recipientUserId);
        notification.setNotificationType(notificationType);
        notification.setChannel(channel);
        notification.setRelatedEntityType(trimToNull(relatedEntityType));
        notification.setRelatedEntityId(trimToNull(relatedEntityId));
        notification.setTitle(title == null ? "Notification" : title.trim());
        notification.setMessage(message == null ? "" : message.trim());
        notification.setReadStatus(NotificationReadStatus.UNREAD);
        notification.setStatus(NotificationStatus.ACTIVE);
        notification.setMetadataJson(writeMetadata(context));
        notification.setCorrelationId(MDC.get("correlationId"));
        return notification;
    }

    private NotificationTemplate findActiveTemplate(String tenantId,
            NotificationType notificationType,
            NotificationChannel channel) {
        return notificationTemplateRepository
                .findFirstByTenantIdAndEventTypeAndChannelAndStatusOrderByDefaultTemplateDescUpdatedAtDesc(
                        tenantId,
                        notificationType,
                        channel,
                        NotificationTemplateStatus.ACTIVE)
                .orElse(null);
    }

    private String writeMetadata(Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(context);
        } catch (JsonProcessingException exception) {
            throw new ApiException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Notification metadata serialization failed.");
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void dispatchPushNotifications(Notification notification, Map<String, Object> context) {
        if (notification.getTenantId() == null || notification.getRecipientUserId() == null) {
            return;
        }
        List<PortalPushDeviceToken> tokens = portalPushDeviceTokenService.findActiveTokens(
                notification.getTenantId(),
                notification.getRecipientUserId());
        for (PortalPushDeviceToken token : tokens) {
            NotificationPushSender.DeliveryResult result = notificationPushSender.send(
                    new NotificationPushSender.PushNotificationCommand(
                            token.getPushToken(),
                            notification.getTitle(),
                            notification.getMessage(),
                            context));
            portalPushDeviceTokenService.markDeliveryResult(token.getId(), result.sent(), result.errorMessage());
        }
    }
}
