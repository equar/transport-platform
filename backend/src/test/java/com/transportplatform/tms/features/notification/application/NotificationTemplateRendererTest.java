package com.transportplatform.tms.features.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import java.util.Map;
import org.junit.jupiter.api.Test;

class NotificationTemplateRendererTest {

    private final NotificationTemplateRenderer notificationTemplateRenderer = new NotificationTemplateRenderer();

    @Test
    void renderReplacesContextPlaceholdersAcrossTemplateFields() {
        NotificationTemplate template = new NotificationTemplate();
        template.setSubjectTemplate("Invoice {{invoiceNumber}} issued");
        template.setTitleTemplate("Payment received from {{billToName}}");
        template.setBodyTemplate("Invoice {{invoiceNumber}} is ready for {{billToName}}.");

        NotificationTemplateRenderer.RenderedTemplate rendered = notificationTemplateRenderer.render(
                template,
                Map.of("invoiceNumber", "INV-1204", "billToName", "Acme Transit"),
                "Fallback subject",
                "Fallback title",
                "Fallback body");

        assertEquals("Invoice INV-1204 issued", rendered.subject());
        assertEquals("Payment received from Acme Transit", rendered.title());
        assertEquals("Invoice INV-1204 is ready for Acme Transit.", rendered.body());
    }

    @Test
    void renderFallsBackWhenTemplateValuesAreBlank() {
        NotificationTemplate template = new NotificationTemplate();
        template.setSubjectTemplate(" ");
        template.setTitleTemplate(null);
        template.setBodyTemplate(" ");

        NotificationTemplateRenderer.RenderedTemplate rendered = notificationTemplateRenderer.render(
                template,
                Map.of(),
                "Fallback subject",
                "Fallback title",
                "Fallback body");

        assertEquals("Fallback subject", rendered.subject());
        assertEquals("Fallback title", rendered.title());
        assertEquals("Fallback body", rendered.body());
    }
}