package com.transportplatform.tms.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.ApiErrorResponse;
import com.transportplatform.tms.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Component
public class SecurityFailureResponseWriter {

    private final ObjectMapper objectMapper;

    public SecurityFailureResponseWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
    }

    public void write(HttpServletResponse response, int status, ErrorCode errorCode, String message)
            throws IOException {
        write(response, status, errorCode, message, Map.of());
    }

    public void write(HttpServletResponse response,
            int status,
            ErrorCode errorCode,
            String message,
            Map<String, Object> details) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.failure(ApiErrorResponse.of(errorCode.name(), message, details)));
    }
}