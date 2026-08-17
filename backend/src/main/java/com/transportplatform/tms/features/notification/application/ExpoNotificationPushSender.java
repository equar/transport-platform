package com.transportplatform.tms.features.notification.application;

import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "app.push.provider", havingValue = "expo")
public class ExpoNotificationPushSender implements NotificationPushSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExpoNotificationPushSender.class);
    private static final String DEFAULT_EXPO_URL = "https://exp.host/--/api/v2/push/send";

    private final boolean enabled;
    private final String accessToken;
    private final RestClient restClient;

    public ExpoNotificationPushSender(
            @Value("${app.push.enabled:false}") boolean enabled,
            @Value("${app.push.expo.url:" + DEFAULT_EXPO_URL + "}") String expoPushUrl,
            @Value("${app.push.expo-access-token:}") String accessToken) {
        this.enabled = enabled;
        this.accessToken = accessToken == null ? "" : accessToken.trim();
        this.restClient = RestClient.builder()
                .baseUrl(expoPushUrl.replace("/--/api/v2/push/send", ""))
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public DeliveryResult send(PushNotificationCommand command) {
        if (!enabled) {
            LOGGER.info("Push delivery is disabled; skipping Expo push delivery.");
            return new DeliveryResult(true, null);
        }
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("to", command.token());
            payload.put("title", command.title());
            payload.put("body", command.body());
            payload.put("data", command.data());
            payload.put("sound", "default");
            payload.put("channelId", "default");

            RestClient.RequestBodySpec request = restClient.post()
                    .uri("/--/api/v2/push/send")
                    .contentType(MediaType.APPLICATION_JSON);
            if (!accessToken.isBlank()) {
                request.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
            }
            Map<String, Object> response = request.body(payload).retrieve().body(Map.class);
            Object data = response == null ? null : response.get("data");
            if (data instanceof Map<?, ?> ticket) {
                Object status = ticket.get("status");
                if ("ok".equals(String.valueOf(status))) {
                    LOGGER.info("Expo push accepted for token {}", redact(command.token()));
                    return new DeliveryResult(true, null);
                }
                Object details = ticket.get("details");
                String errorMessage = details == null ? String.valueOf(ticket.get("message")) : String.valueOf(details);
                LOGGER.warn("Expo push send failed for token {}: {}", redact(command.token()), errorMessage);
                return new DeliveryResult(false, errorMessage);
            }
            return new DeliveryResult(true, null);
        } catch (RuntimeException exception) {
            LOGGER.warn("Expo push delivery failed for token {}: {}", redact(command.token()), exception.getMessage());
            return new DeliveryResult(false, exception.getMessage());
        }
    }

    private String redact(String token) {
        if (token == null || token.isBlank()) {
            return "<missing>";
        }
        String normalized = token.trim();
        if (normalized.length() <= 20) {
            return normalized;
        }
        return normalized.substring(0, 16) + "..." + normalized.substring(normalized.length() - 4);
    }
}
