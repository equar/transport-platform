package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class NotificationTemplateRenderer {

    public RenderedTemplate render(NotificationTemplate template,
            Map<String, Object> context,
            String fallbackSubject,
            String fallbackTitle,
            String fallbackBody) {
        return new RenderedTemplate(
                renderValue(template == null ? fallbackSubject : template.getSubjectTemplate(), context,
                        fallbackSubject),
                renderValue(template == null ? fallbackTitle : template.getTitleTemplate(), context, fallbackTitle),
                renderValue(template == null ? fallbackBody : template.getBodyTemplate(), context, fallbackBody));
    }

    private String renderValue(String template, Map<String, Object> context, String fallback) {
        String resolved = template == null || template.isBlank() ? fallback : template;
        if (resolved == null || context == null || context.isEmpty()) {
            return resolved;
        }
        String output = resolved;
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            output = output.replace("{{" + entry.getKey() + "}}",
                    entry.getValue() == null ? "" : entry.getValue().toString());
        }
        return output;
    }

    public record RenderedTemplate(String subject, String title, String body) {
    }
}