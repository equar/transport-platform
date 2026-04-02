package com.transportplatform.tms.features.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class SmtpNotificationEmailSenderTest {

    @Mock
    private JavaMailSender javaMailSender;

    @Test
    void sendsUsingConfiguredFromAddress() {
        MailProperties mailProperties = new MailProperties();
        mailProperties.setUsername("smtp-user@example.com");

        NotificationEmailProperties notificationEmailProperties = new NotificationEmailProperties();
        notificationEmailProperties.setFromAddress("noreply@transport.example");
        notificationEmailProperties.setReplyTo("support@transport.example");

        SmtpNotificationEmailSender sender = new SmtpNotificationEmailSender(
                javaMailSender,
                mailProperties,
                notificationEmailProperties);

        NotificationEmailSender.DeliveryResult result = sender.send(
                new NotificationEmailSender.NotificationEmailCommand(
                        "user@example.com",
                        "Password reset instructions",
                        "Reset your password",
                        "Use the secure reset link."));

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(javaMailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertTrue(result.sent());
        assertNull(result.errorMessage());
        assertEquals("noreply@transport.example", message.getFrom());
        assertEquals("support@transport.example", message.getReplyTo());
        assertEquals("Password reset instructions", message.getSubject());
        assertEquals(
                "Reset your password" + System.lineSeparator() + System.lineSeparator() + "Use the secure reset link.",
                message.getText());
        assertEquals("user@example.com", message.getTo()[0]);
    }

    @Test
    void returnsFailureWhenMailSenderThrows() {
        MailProperties mailProperties = new MailProperties();
        mailProperties.setUsername("smtp-user@example.com");

        NotificationEmailProperties notificationEmailProperties = new NotificationEmailProperties();

        doThrow(new MailSendException("SMTP unavailable")).when(javaMailSender).send(any(SimpleMailMessage.class));

        SmtpNotificationEmailSender sender = new SmtpNotificationEmailSender(
                javaMailSender,
                mailProperties,
                notificationEmailProperties);

        NotificationEmailSender.DeliveryResult result = sender.send(
                new NotificationEmailSender.NotificationEmailCommand(
                        "user@example.com",
                        "Subject",
                        "Subject",
                        "Body"));

        assertEquals(false, result.sent());
        assertEquals("SMTP unavailable", result.errorMessage());
    }
}