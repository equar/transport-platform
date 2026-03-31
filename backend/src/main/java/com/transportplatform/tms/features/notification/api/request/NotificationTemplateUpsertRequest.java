package com.transportplatform.tms.features.notification.api.request;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NotificationTemplateUpsertRequest(
        @NotBlank(message = "Template name is required.") @Size(max = 150, message = "Template name must be 150 characters or fewer.") String name,
        @NotNull(message = "Event type is required.") NotificationType eventType,
        @NotNull(message = "Channel is required.") NotificationChannel channel,
        @Size(max = 255, message = "Subject template must be 255 characters or fewer.") String subjectTemplate,
        @Size(max = 255, message = "Title template must be 255 characters or fewer.") String titleTemplate,
        @NotBlank(message = "Body template is required.") @Size(max = 4000, message = "Body template must be 4000 characters or fewer.") String bodyTemplate,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.") String description,
        Boolean isDefault) {
}