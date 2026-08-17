package com.transportplatform.tms.features.notification.application;

import java.util.Map;

public interface NotificationPushSender {

    DeliveryResult send(PushNotificationCommand command);

    record PushNotificationCommand(String token, String title, String body, Map<String, Object> data) {
    }

    record DeliveryResult(boolean sent, String errorMessage) {
    }
}
