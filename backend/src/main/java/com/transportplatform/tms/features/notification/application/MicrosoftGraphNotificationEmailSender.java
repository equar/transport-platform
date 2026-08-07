package com.transportplatform.tms.features.notification.application;

import java.util.LinkedList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.microsoft.graph.models.BodyType;
import com.microsoft.graph.models.EmailAddress;
import com.microsoft.graph.models.ItemBody;
import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Recipient;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import com.microsoft.graph.users.item.sendmail.SendMailPostRequestBody;

@Component
@ConditionalOnProperty(name = "app.email.provider", havingValue = "microsoft-graph")
public class MicrosoftGraphNotificationEmailSender implements NotificationEmailSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(MicrosoftGraphNotificationEmailSender.class);

    private final boolean enabled;
    private final String fromAddress;
    private final GraphServiceClient graphServiceClient;

    public MicrosoftGraphNotificationEmailSender(
            @Value("${app.email.enabled:false}") boolean enabled,
            @Value("${app.email.from:}") String fromAddress,
            @Value("${app.microsoft.graph.client-id:}") String clientId,
            @Value("${app.microsoft.graph.tenant-id:}") String tenantId,
            @Value("${app.microsoft.graph.client-secret:}") String clientSecret,
            @Value("${app.microsoft.graph.scopes:https://graph.microsoft.com/.default}") String scopes) {
        this.enabled = enabled;
        this.fromAddress = requireConfiguration("APP_EMAIL_FROM", fromAddress);
        ClientSecretCredential credential = new ClientSecretCredentialBuilder()
                .clientId(requireConfiguration("MICROSOFT_GRAPH_CLIENT_ID", clientId))
                .tenantId(requireConfiguration("MICROSOFT_GRAPH_TENANT_ID", tenantId))
                .clientSecret(requireConfiguration("MICROSOFT_GRAPH_CLIENT_SECRET", clientSecret))
                .build();
        this.graphServiceClient = new GraphServiceClient(credential, scopes.split(","));
    }

    @Override
    public DeliveryResult send(NotificationEmailCommand command) {
        if (!enabled) {
            LOGGER.info("Email delivery is disabled; skipping Microsoft Graph delivery.");
            return new DeliveryResult(true, null);
        }
        try {
            Message message = new Message();
            message.setSubject(command.subject());

            ItemBody body = new ItemBody();
            body.setContentType(BodyType.Html);
            body.setContent(toHtml(command.title(), command.body()));
            message.setBody(body);

            Recipient recipient = new Recipient();
            EmailAddress emailAddress = new EmailAddress();
            emailAddress.setAddress(command.recipientEmail());
            recipient.setEmailAddress(emailAddress);
            LinkedList<Recipient> recipients = new LinkedList<>();
            recipients.add(recipient);
            message.setToRecipients(recipients);

            SendMailPostRequestBody request = new SendMailPostRequestBody();
            request.setMessage(message);
            request.setSaveToSentItems(true);
            graphServiceClient.users().byUserId(fromAddress).sendMail().post(request);
            return new DeliveryResult(true, null);
        } catch (RuntimeException exception) {
            LOGGER.error("Microsoft Graph email delivery failed for notification recipient: {}",
                    exception.getMessage());
            return new DeliveryResult(false, "Microsoft Graph email delivery failed.");
        }
    }

    private static String requireConfiguration(String name, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is required when APP_EMAIL_PROVIDER=microsoft-graph.");
        }
        return value.trim();
    }

    private static String toHtml(String title, String body) {
        return "<html><body style=\"font-family:Arial,sans-serif;color:#0f172a;line-height:1.5\">"
                + "<h2>" + escapeHtml(title) + "</h2><p>" + escapeHtml(body).replace("\n", "<br>")
                + "</p></body></html>";
    }

    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
