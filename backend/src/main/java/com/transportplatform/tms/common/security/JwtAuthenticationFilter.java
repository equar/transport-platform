package com.transportplatform.tms.common.security;

import com.transportplatform.tms.common.tenant.TenantContext;
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

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
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
