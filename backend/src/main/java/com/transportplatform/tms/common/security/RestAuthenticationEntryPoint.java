package com.transportplatform.tms.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.ApiErrorResponse;
import com.transportplatform.tms.common.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiResponse<Void> body = ApiResponse.failure(ApiErrorResponse.of(
                ErrorCode.UNAUTHORIZED.name(),
                "Authentication is required.",
                Map.of("path", request.getRequestURI())));
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
