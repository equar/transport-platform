package com.transportplatform.tms.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.ApiErrorResponse;
import com.transportplatform.tms.common.response.ApiResponse;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        boolean passwordChangeRequired =
                "Password change required".equals(accessDeniedException.getMessage());
        var details = new java.util.LinkedHashMap<String, Object>();
        details.put("path", request.getRequestURI());
        if (passwordChangeRequired) details.put("authAction", "CHANGE_PASSWORD");
        if ("MFA enrollment required".equals(accessDeniedException.getMessage()))
            details.put("authAction", "ENROLL_MFA");
        ApiResponse<Void> body =
                ApiResponse.failure(
                        ApiErrorResponse.of(
                                ErrorCode.FORBIDDEN.name(),
                                passwordChangeRequired
                                        ? "A password change is required. Update it in the admin"
                                              + " portal before continuing."
                                        : "Subscription unavailable"
                                                        .equals(accessDeniedException.getMessage())
                                                ? "Subscription access is unavailable. Contact the"
                                                      + " platform administrator to restore access."
                                                : "MFA enrollment required"
                                                                .equals(
                                                                        accessDeniedException
                                                                                .getMessage())
                                                        ? "Set up an authenticator before accessing"
                                                              + " this workspace."
                                                        : "Access is denied.",
                                details));
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
