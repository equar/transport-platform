package com.transportplatform.tms.common.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.response.ApiErrorResponse;
import com.transportplatform.tms.common.response.ApiResponse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final String CODE_TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS";

    private final SecurityProperties securityProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Autowired
    public AuthRateLimitFilter(SecurityProperties securityProperties, ObjectMapper objectMapper) {
        this(securityProperties, objectMapper, Clock.systemUTC());
    }

    AuthRateLimitFilter(SecurityProperties securityProperties, ObjectMapper objectMapper, Clock clock) {
        this.securityProperties = securityProperties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        SecurityProperties.AuthRateLimit config = securityProperties.getAuthRateLimit();
        if (!config.isEnabled() || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();
        int limit = resolveLimit(path, config);
        if (limit <= 0) {
            filterChain.doFilter(request, response);
            return;
        }

        Instant now = Instant.now(clock);
        RateLimitDecision decision = consume(path + "::" + clientIp(request), limit, config.getWindow(), now);
        if (decision.allowed()) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
        ApiResponse<Void> body = ApiResponse.failure(ApiErrorResponse.of(
                CODE_TOO_MANY_REQUESTS,
                "Too many authentication requests. Try again shortly.",
                Map.of(
                        "path", request.getRequestURI(),
                        "retryAfterSeconds", decision.retryAfterSeconds())));
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private int resolveLimit(String path, SecurityProperties.AuthRateLimit config) {
        if ("/v1/auth/login".equals(path)) {
            return config.getLoginMaxRequests();
        }
        if ("/v1/auth/refresh".equals(path)) {
            return config.getRefreshMaxRequests();
        }
        if ("/v1/auth/forgot-password".equals(path)) {
            return config.getForgotPasswordMaxRequests();
        }
        return 0;
    }

    private RateLimitDecision consume(String key, int limit, Duration window, Instant now) {
        WindowCounter counter = counters.compute(key, (unused, existing) -> {
            if (existing == null || now.isAfter(existing.windowStartedAt().plus(window))) {
                return new WindowCounter(now, 1);
            }
            return new WindowCounter(existing.windowStartedAt(), existing.count() + 1);
        });

        if (counter.count() <= limit) {
            return new RateLimitDecision(true, 0);
        }

        long retryAfter = Duration.between(now, counter.windowStartedAt().plus(window)).toSeconds();
        return new RateLimitDecision(false, Math.max(1, retryAfter));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int separator = forwardedFor.indexOf(',');
            return (separator >= 0 ? forwardedFor.substring(0, separator) : forwardedFor).trim();
        }
        return request.getRemoteAddr();
    }

    private record WindowCounter(Instant windowStartedAt, int count) {
    }

    private record RateLimitDecision(boolean allowed, long retryAfterSeconds) {
    }
}