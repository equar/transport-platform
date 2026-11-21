package com.transportplatform.tms.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.response.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.filter.OncePerRequestFilter;

/** Wraps authentication as well as MVC; never translates a credential failure into an outage. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ServiceAvailabilityFilter extends OncePerRequestFilter {
    private final ObjectMapper mapper;
    public ServiceAvailabilityFilter(ObjectMapper mapper) { this.mapper = mapper; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        try { chain.doFilter(request, response); }
        catch (RuntimeException | ServletException exception) {
            Throwable cause = exception;
            boolean unavailable = false;
            while (cause != null) {
                if (cause instanceof DataAccessResourceFailureException || cause instanceof CannotCreateTransactionException
                        || cause instanceof org.springframework.dao.QueryTimeoutException
                        || cause instanceof org.springframework.dao.TransientDataAccessResourceException) {
                    unavailable = true; break;
                }
                if (cause.getCause() == cause) break;
                cause = cause.getCause();
            }
            if (!unavailable || response.isCommitted()) throw exception;
            SecurityContextHolder.clearContext();
            com.transportplatform.tms.common.tenant.TenantContext.clear();
            org.slf4j.LoggerFactory.getLogger(getClass()).error("Request dependency unavailable; correlationId={}",
                    response.getHeader("X-Correlation-Id"));
            response.resetBuffer();
            response.setStatus(503);
            response.setContentType("application/json");
            response.setHeader("Retry-After", "30");
            response.setHeader("Cache-Control", "no-store");
            mapper.writeValue(response.getOutputStream(), ApiResponse.failure(ApiErrorResponse.of(
                    "SERVICE_UNAVAILABLE", "The service is temporarily unavailable. If you were saving, check the record before submitting again.", Map.of())));
        }
    }
}
