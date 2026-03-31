package com.transportplatform.tms.common.response;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
        String code,
        String message,
        Instant timestamp,
        Map<String, Object> details) {

    public static ApiErrorResponse of(String code, String message, Map<String, Object> details) {
        return new ApiErrorResponse(code, message, Instant.now(), details == null ? Map.of() : details);
    }
}
