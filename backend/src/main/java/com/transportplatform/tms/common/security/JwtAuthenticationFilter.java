package com.transportplatform.tms.common.security;

import com.transportplatform.tms.common.tenant.TenantContext;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
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
    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;

    public JwtAuthenticationFilter(JwtService jwtService,
            TenantRepository tenantRepository,
            AppUserRepository appUserRepository) {
        this.jwtService = jwtService;
        this.tenantRepository = tenantRepository;
        this.appUserRepository = appUserRepository;
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
            var storedUser = appUserRepository.findById(claims.userId()).orElse(null);
            if (storedUser == null
                    || (storedUser.getPasswordChangedAt() != null
                            && claims.issuedAt().isBefore(storedUser.getPasswordChangedAt()))) {
                SecurityContextHolder.clearContext();
                TenantContext.clear();
                filterChain.doFilter(request, response);
                return;
            }
            if (claims.tenantId() != null && !claims.tenantId().isBlank()
                    && tenantRepository.findById(claims.tenantId())
                            .map(tenant -> tenant.getStatus() != TenantStatus.ACTIVE)
                            .orElse(true)) {
                SecurityContextHolder.clearContext();
                TenantContext.clear();
                filterChain.doFilter(request, response);
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
                    Boolean.TRUE.equals(claims.mustChangePassword()),
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
