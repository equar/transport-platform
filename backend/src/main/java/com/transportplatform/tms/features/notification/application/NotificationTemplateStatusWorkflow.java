package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import org.springframework.http.HttpStatus;

public final class NotificationTemplateStatusWorkflow {

    private NotificationTemplateStatusWorkflow() {
    }

    public static void ensureCanActivate(NotificationTemplate template) {
        if (template.getStatus() == NotificationTemplateStatus.ACTIVE) {
            throw invalidTransition("Notification template is already active.");
        }
    }

    public static void ensureCanDeactivate(NotificationTemplate template) {
        if (template.getStatus() == NotificationTemplateStatus.INACTIVE) {
            throw invalidTransition("Notification template is already inactive.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}