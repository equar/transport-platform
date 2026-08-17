package com.transportplatform.tms.features.notification.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.push.provider", havingValue = "logging", matchIfMissing = true)
public class LoggingNotificationPushSender implements NotificationPushSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingNotificationPushSender.class);

    @Override
    public DeliveryResult send(PushNotificationCommand command) {
        LOGGER.info("Push notification hook queued for token {} with title '{}'",
                redact(command.token()), command.title());
        return new DeliveryResult(true, null);
    }

    private String redact(String token) {
        if (token == null || token.length() < 12) {
            return "unknown-token";
        }
        return token.substring(0, 6) + "…" + token.substring(token.length() - 4);
    }
}
