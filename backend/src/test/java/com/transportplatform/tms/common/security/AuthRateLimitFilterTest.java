package com.transportplatform.tms.common.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.lang.NonNull;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import jakarta.servlet.ServletException;

class AuthRateLimitFilterTest {

    @Test
    void blocksAfterLimitForLogin() throws ServletException, IOException {
        SecurityProperties properties = propertiesWithSmallLimit();
        ObjectMapper objectMapper = JsonMapper.builder().findAndAddModules().build();
        AuthRateLimitFilter filter = new AuthRateLimitFilter(
                properties,
            objectMapper,
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));

        MockHttpServletRequest firstRequest = request("/v1/auth/login", "10.0.0.1");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());
        assertEquals(200, firstResponse.getStatus());

        MockHttpServletRequest secondRequest = request("/v1/auth/login", "10.0.0.1");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());
        assertEquals(429, secondResponse.getStatus());
    }

    @Test
    void doesNotLimitNonAuthEndpoint() throws ServletException, IOException {
        SecurityProperties properties = propertiesWithSmallLimit();
        ObjectMapper objectMapper = JsonMapper.builder().findAndAddModules().build();
        AuthRateLimitFilter filter = new AuthRateLimitFilter(
                properties,
            objectMapper,
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));

        MockHttpServletRequest request = request("/v1/drivers", "10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(200, response.getStatus());
    }

    private SecurityProperties propertiesWithSmallLimit() {
        SecurityProperties properties = new SecurityProperties();
        properties.getAuthRateLimit().setEnabled(true);
        properties.getAuthRateLimit().setLoginMaxRequests(1);
        properties.getAuthRateLimit().setRefreshMaxRequests(1);
        properties.getAuthRateLimit().setForgotPasswordMaxRequests(1);
        return properties;
    }

    private MockHttpServletRequest request(@NonNull String servletPath, @NonNull String remoteAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", servletPath);
        request.setServletPath(servletPath);
        request.setRemoteAddr(remoteAddress);
        return request;
    }
}
