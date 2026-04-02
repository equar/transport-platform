package com.transportplatform.tms.features.notification.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "spring.mail", name = "host")
public class SmtpNotificationEmailSender implements NotificationEmailSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(SmtpNotificationEmailSender.class);

    private final JavaMailSender javaMailSender;
    private final MailProperties mailProperties;
    private final NotificationEmailProperties notificationEmailProperties;

    public SmtpNotificationEmailSender(JavaMailSender javaMailSender,
            MailProperties mailProperties,
            NotificationEmailProperties notificationEmailProperties) {
        this.javaMailSender = javaMailSender;
        this.mailProperties = mailProperties;
        this.notificationEmailProperties = notificationEmailProperties;
    }

    @Override
    public DeliveryResult send(NotificationEmailCommand command) {
        String fromAddress = firstNonBlank(notificationEmailProperties.getFromAddress(), mailProperties.getUsername());
        if (isBlank(fromAddress)) {
            String message = "Notification email sender is missing a configured from address.";
            LOGGER.warn(message);
            return new DeliveryResult(false, message);
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(command.recipientEmail());
            message.setFrom(fromAddress);
            if (!isBlank(notificationEmailProperties.getReplyTo())) {
                message.setReplyTo(notificationEmailProperties.getReplyTo().trim());
            }
            message.setSubject(command.subject());
            message.setText(renderBody(command));
            javaMailSender.send(message);
            return new DeliveryResult(true, null);
        } catch (MailException | IllegalArgumentException exception) {
            LOGGER.warn("Email delivery failed for {}", command.recipientEmail(), exception);
            return new DeliveryResult(false, exception.getMessage());
        }
    }

    private String renderBody(NotificationEmailCommand command) {
        if (isBlank(command.title()) || command.title().equals(command.subject())) {
            return command.body();
        }
        return command.title().trim() + System.lineSeparator() + System.lineSeparator() + command.body();
    }

    private String firstNonBlank(String primary, String secondary) {
        if (!isBlank(primary)) {
            return primary.trim();
        }
        if (!isBlank(secondary)) {
            return secondary.trim();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}