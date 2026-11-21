package com.transportplatform.tms.common.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;

/** Failed attempts are security telemetry, not falsely committed business audit events. */
@Component
public class RejectedMutationTelemetryFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean failed = false;
        try {
            chain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException exception) {
            failed = true;
            throw exception;
        } finally {
            if (java.util.Set.of("POST", "PUT", "PATCH", "DELETE").contains(request.getMethod())
                    && (failed || response.getStatus() >= 400)) {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                var user =
                        auth != null && auth.getPrincipal() instanceof AuthenticatedUser u
                                ? u
                                : null;
                Object route = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                org.slf4j.LoggerFactory.getLogger(getClass())
                        .warn(
                                "SECURITY_MUTATION_REJECTED actor={} tenant={} method={} route={}"
                                        + " status={}",
                                user == null ? null : user.id(),
                                user == null ? null : user.tenantId(),
                                request.getMethod(),
                                route == null ? "security-boundary" : route,
                                failed ? 500 : response.getStatus());
            }
        }
    }
}
