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
    private final com.transportplatform.tms.common.tenant.TenantProperties tenantProperties;
    private final RestAccessDeniedHandler deniedHandler;

    public JwtAuthenticationFilter(JwtService jwtService,
            TenantRepository tenantRepository,
            AppUserRepository appUserRepository,
            com.transportplatform.tms.common.tenant.TenantProperties tenantProperties, RestAccessDeniedHandler deniedHandler) {
        this.jwtService = jwtService;
        this.tenantRepository = tenantRepository;
        this.appUserRepository = appUserRepository;
        this.tenantProperties = tenantProperties; this.deniedHandler = deniedHandler;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        TenantContext.clear();
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
                    || !storedUser.isActiveForLogin() || storedUser.isTemporaryPasswordExpired(java.time.Instant.now())
                    || !storedUser.getEmail().equalsIgnoreCase(claims.subject())
                    || !java.util.Objects.equals(storedUser.getTenantId(), claims.tenantId())
                    || claims.securityVersion() != storedUser.getSecurityVersion()
                    || !java.util.Objects.equals(claims.roles(), storedUser.getRoles().stream()
                            .map(Enum::name).collect(java.util.stream.Collectors.toSet()))
                    || (storedUser.getPasswordChangedAt() != null
                            && claims.issuedAt().isBefore(storedUser.getPasswordChangedAt().truncatedTo(java.time.temporal.ChronoUnit.SECONDS)))) {
                SecurityContextHolder.clearContext();
                TenantContext.clear();
                filterChain.doFilter(request, response);
                return;
            }
            boolean platformAccount = storedUser.getRoles().contains(com.transportplatform.tms.features.auth.domain.RoleName.ROLE_PLATFORM_ADMIN);
            if ((platformAccount && (StringUtils.hasText(storedUser.getTenantId()) || storedUser.getRoles().size() != 1))
                    || (!platformAccount && !StringUtils.hasText(storedUser.getTenantId()))) {
                SecurityContextHolder.clearContext(); filterChain.doFilter(request, response); return;
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
            String requestedTenant = request.getHeader(tenantProperties.getHeaderName());
            if (requestedTenant != null && !requestedTenant.isBlank()
                    && !java.util.Objects.equals(requestedTenant.trim(), storedUser.getTenantId())) {
                deniedHandler.handle(request, response, new org.springframework.security.access.AccessDeniedException("Tenant mismatch"));
                return;
            }
            AuthenticatedUser user = new AuthenticatedUser(
                    claims.userId(),
                    storedUser.getTenantId(),
                    storedUser.getEmail(),
                    storedUser.getFirstName(),
                    storedUser.getLastName(),
                    "",
                    true,
                    true,
                    storedUser.isMustChangePassword(),
                    storedUser.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.name())).toList(), storedUser.getSecurityVersion());
            String endpoint = request.getRequestURI().substring(request.getContextPath().length());
            if (user.mustChangePassword() && !java.util.Set.of("/v1/auth/change-password", "/v1/auth/logout",
                    "/v1/auth/refresh", "/v1/auth/status", "/runtime/tenant-branding").contains(endpoint)) {
                deniedHandler.handle(request, response, new org.springframework.security.access.AccessDeniedException("Password change required"));
                return;
            }
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                    List.copyOf(user.getAuthorities()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            if (storedUser.getTenantId() != null && !storedUser.getTenantId().isBlank()) {
                TenantContext.setTenantId(storedUser.getTenantId());
            }
        } catch (JwtException | IllegalArgumentException ignored) {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
        }

        try { filterChain.doFilter(request, response); } finally { TenantContext.clear(); }
    }
}
