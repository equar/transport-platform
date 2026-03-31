package com.transportplatform.tms.features.notification.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingNotificationEmailSender implements NotificationEmailSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingNotificationEmailSender.class);

    @Override
    public DeliveryResult send(NotificationEmailCommand command) {
        LOGGER.info("Email notification hook queued for {} with subject '{}'", command.recipientEmail(),
                command.subject());
        return new DeliveryResult(true, null);
    }
}