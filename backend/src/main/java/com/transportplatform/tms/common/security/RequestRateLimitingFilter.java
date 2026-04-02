package com.transportplatform.tms.common.security;

import com.transportplatform.tms.common.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestRateLimitingFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final InMemoryRequestRateLimiter rateLimiter;
    private final SecurityFailureResponseWriter securityFailureResponseWriter;

    public RequestRateLimitingFilter(SecurityProperties securityProperties,
            InMemoryRequestRateLimiter rateLimiter,
            SecurityFailureResponseWriter securityFailureResponseWriter) {
        this.securityProperties = securityProperties;
        this.rateLimiter = rateLimiter;
        this.securityFailureResponseWriter = securityFailureResponseWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if (!securityProperties.getRateLimit().isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitPolicy policy = resolvePolicy(request);
        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = resolveClientKey(request);
        InMemoryRequestRateLimiter.RateLimitDecision decision = rateLimiter.tryConsume(
                policy.bucket() + ":" + clientKey,
                policy.configuration());

        response.setHeader("X-RateLimit-Limit", String.valueOf(policy.configuration().getCapacity()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(decision.remaining()));
        response.setHeader("X-RateLimit-Reset", decision.resetAt().toString());

        if (!decision.allowed()) {
            securityFailureResponseWriter.write(
                    response,
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    ErrorCode.RATE_LIMITED,
                    "Too many requests were received for this operation. Please wait and try again.",
                    java.util.Map.of("retryAt", decision.resetAt().toString()));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitPolicy resolvePolicy(HttpServletRequest request) {
        String method = request.getMethod();
        String servletPath = request.getServletPath();
        SecurityProperties.RateLimit rateLimit = securityProperties.getRateLimit();

        List<RateLimitPolicy> policies = List.of(
                new RateLimitPolicy(HttpMethod.POST.name(), "/v1/auth/login", "auth-login", rateLimit.getLogin()),
                new RateLimitPolicy(HttpMethod.POST.name(), "/v1/auth/refresh", "auth-refresh", rateLimit.getRefresh()),
                new RateLimitPolicy(HttpMethod.POST.name(), "/company-applications", "company-application",
                        rateLimit.getCompanyApplication()));

        for (RateLimitPolicy policy : policies) {
            if (policy.matches(method, servletPath)) {
                return policy;
            }
        }

        return null;
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }

        String remoteAddress = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddress) ? remoteAddress : "unknown-client";
    }

    private record RateLimitPolicy(String method,
            String path,
            String bucket,
            SecurityProperties.Policy configuration) {

        private boolean matches(String requestMethod, String requestPath) {
            return method.equalsIgnoreCase(requestMethod) && path.equals(requestPath);
        }
    }
}