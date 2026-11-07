package com.transportplatform.tms.features.notification.application;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class NotificationEmailHtmlRendererTest {

    private final NotificationEmailHtmlRenderer notificationEmailHtmlRenderer = new NotificationEmailHtmlRenderer();

    @Test
    void renderCreatesBrandedLayoutAndSafelyFormatsMessageContent() {
        String rendered = notificationEmailHtmlRenderer.render(
                "Driver <review>",
                "Your documents are ready.\nContinue at https://portal.example.com/review?driver=42&next=true\n<script>alert(1)</script>");

        assertTrue(rendered.contains("Transport Platform"));
        assertTrue(rendered.contains("background:#084aa8"));
        assertTrue(rendered.contains("Driver &lt;review&gt;"));
        assertTrue(rendered.contains("<br>Continue at"));
        assertTrue(rendered.contains("href=\"https://portal.example.com/review?driver=42&amp;next=true\""));
        assertTrue(rendered.contains("&lt;script&gt;alert(1)&lt;/script&gt;"));
    }
}