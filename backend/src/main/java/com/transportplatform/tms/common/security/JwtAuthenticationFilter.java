package com.transportplatform.tms.common.security;

import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.tenant.TenantContext;
import com.transportplatform.tms.common.tenant.TenantProperties;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TenantProperties tenantProperties;
    private final SecurityFailureResponseWriter securityFailureResponseWriter;

    public JwtAuthenticationFilter(JwtService jwtService,
            TenantProperties tenantProperties,
            SecurityFailureResponseWriter securityFailureResponseWriter) {
        this.jwtService = jwtService;
        this.tenantProperties = tenantProperties;
        this.securityFailureResponseWriter = securityFailureResponseWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);

        try {
            JwtClaims claims = jwtService.parseAccessToken(token);
            String requestTenantId = request.getHeader(tenantProperties.getHeaderName());
            if (StringUtils.hasText(requestTenantId)
                    && StringUtils.hasText(claims.tenantId())
                    && !claims.tenantId().equals(requestTenantId)) {
                SecurityContextHolder.clearContext();
                TenantContext.clear();
                securityFailureResponseWriter.write(
                        response,
                        HttpServletResponse.SC_FORBIDDEN,
                        ErrorCode.FORBIDDEN,
                        "The supplied tenant context does not match the authenticated workspace.");
                return;
            }

            AuthenticatedUser user = new AuthenticatedUser(
                    claims.userId(),
                    claims.tenantId(),
                    claims.subject(),
                    claims.firstName(),
                    claims.lastName(),
                    "",
                    true,
                    true,
                    claims.roles().stream().map(SimpleGrantedAuthority::new).toList());
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                    List.copyOf(user.getAuthorities()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            if (claims.tenantId() != null && !claims.tenantId().isBlank()) {
                TenantContext.setTenantId(claims.tenantId());
            }
        } catch (JwtException ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
