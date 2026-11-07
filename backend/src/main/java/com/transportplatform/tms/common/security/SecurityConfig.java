package com.transportplatform.tms.common.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.transportplatform.tms.common.observability.RequestCorrelationFilter;
import com.transportplatform.tms.common.tenant.TenantContextFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final SecurityProperties securityProperties;
        private final RequestCorrelationFilter requestCorrelationFilter;
        private final AuthRateLimitFilter authRateLimitFilter;
    private final TenantContextFilter tenantContextFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final TenantModuleAccessFilter tenantModuleAccessFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    public SecurityConfig(SecurityProperties securityProperties,
                        RequestCorrelationFilter requestCorrelationFilter,
                        AuthRateLimitFilter authRateLimitFilter,
            TenantContextFilter tenantContextFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            TenantModuleAccessFilter tenantModuleAccessFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler) {
        this.securityProperties = securityProperties;
                this.requestCorrelationFilter = requestCorrelationFilter;
                this.authRateLimitFilter = authRateLimitFilter;
        this.tenantContextFilter = tenantContextFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.tenantModuleAccessFilter = tenantModuleAccessFilter;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        String[] publicDocumentationEndpoints = securityProperties.isApiDocsEnabled()
                ? new String[] { "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**" }
                : new String[0];
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).preload(true)))
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/**").hasRole("PLATFORM_ADMIN")
                        .requestMatchers(publicDocumentationEndpoints).permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/auth/login", "/v1/auth/refresh", "/v1/auth/logout", "/v1/auth/forgot-password", "/v1/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/company-applications", "/demo-inquiries").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/auth/status").permitAll()
                        .requestMatchers(HttpMethod.GET, "/runtime/tenant-branding").permitAll()
                        .requestMatchers("/platform/**").hasRole("PLATFORM_ADMIN")
                        .requestMatchers("/company/**").hasAnyRole("TENANT_ADMIN", "DISPATCHER", "BILLING_ADMIN", "COMPLIANCE_ADMIN")
                        .requestMatchers("/portal/driver/**").hasRole("DRIVER")
                        .requestMatchers("/portal/rider/**").hasAnyRole("RIDER", "GUARDIAN")
                        .requestMatchers("/portal/organization/**").hasRole("ORGANIZATION_USER")
                        .anyRequest().authenticated())
                .addFilterBefore(requestCorrelationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(tenantContextFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(tenantModuleAccessFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(securityProperties.getAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant-Id", "X-Client-Platform",
                "Idempotency-Key", "X-Expected-Ride-Status", "If-Match", RequestCorrelationFilter.HEADER_NAME));
        configuration.setExposedHeaders(List.of("Authorization", RequestCorrelationFilter.HEADER_NAME));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
