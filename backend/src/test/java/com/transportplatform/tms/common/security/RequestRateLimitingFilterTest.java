package com.transportplatform.tms.common.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestRateLimitingFilterTest {

    @Test
    void throttlesRepeatedLoginRequestsFromTheSameClient() throws Exception {
        SecurityProperties securityProperties = new SecurityProperties();
        securityProperties.getRateLimit().getLogin().setCapacity(2);
        securityProperties.getRateLimit().getLogin().setWindow(java.time.Duration.ofMinutes(5));
        RequestRateLimitingFilter filter = new RequestRateLimitingFilter(
                securityProperties,
                new InMemoryRequestRateLimiter(Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC)),
                new SecurityFailureResponseWriter(new ObjectMapper()));

        MockHttpServletResponse firstResponse = executeLoginRequest(filter);
        MockHttpServletResponse secondResponse = executeLoginRequest(filter);
        MockHttpServletResponse thirdResponse = executeLoginRequest(filter);

        assertEquals(200, firstResponse.getStatus());
        assertEquals("1", firstResponse.getHeader("X-RateLimit-Remaining"));
        assertEquals(200, secondResponse.getStatus());
        assertEquals("0", secondResponse.getHeader("X-RateLimit-Remaining"));
        assertEquals(429, thirdResponse.getStatus());
        assertTrue(thirdResponse.getContentAsString().contains("RATE_LIMITED"));
        assertTrue(thirdResponse.getContentAsString().contains("retryAt"));
    }

    private MockHttpServletResponse executeLoginRequest(RequestRateLimitingFilter filter) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setServletPath("/v1/auth/login");
        request.setRemoteAddr("10.0.0.5");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}