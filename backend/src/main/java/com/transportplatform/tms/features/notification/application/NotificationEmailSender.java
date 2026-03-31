package com.transportplatform.tms.features.notification.application;

public interface NotificationEmailSender {

    DeliveryResult send(NotificationEmailCommand command);

    record NotificationEmailCommand(String recipientEmail, String subject, String title, String body) {
    }

    record DeliveryResult(boolean sent, String errorMessage) {
    }
}