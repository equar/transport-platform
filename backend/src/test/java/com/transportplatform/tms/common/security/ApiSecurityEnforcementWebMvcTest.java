package com.transportplatform.tms.common.security;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.filter.OncePerRequestFilter;

import com.transportplatform.tms.common.config.PaginationGuardInterceptor;
import com.transportplatform.tms.common.exception.GlobalExceptionHandler;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebMvcTest
@Import({
        ApiSecurityEnforcementWebMvcTest.TestSecurityConfig.class,
    ProtectedEndpointTestController.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class,
        PaginationGuardInterceptor.class,
        GlobalExceptionHandler.class,
})
class ApiSecurityEnforcementWebMvcTest {

    @Configuration
    @EnableMethodSecurity
    static class TestSecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
        RestAuthenticationEntryPoint restAuthenticationEntryPoint,
        RestAccessDeniedHandler restAccessDeniedHandler) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler))
                    .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/test/protected-admin").authenticated()
                            .anyRequest().authenticated())
                    .addFilterBefore(testHeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            ;

        return http.build();
    }

        @Bean
        OncePerRequestFilter testHeaderAuthenticationFilter() {
            return new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {
                    String role = request.getHeader("X-Test-Role");
                    if (role != null && !role.isBlank()) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        "test-user",
                                        null,
                                        java.util.List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                    filterChain.doFilter(request, response);
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void protectedEndpointWithoutAuthenticationReturnsUnauthorizedErrorPayload() throws Exception {
        mockMvc.perform(get("/test/protected-admin"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Authentication is required."))
            .andExpect(jsonPath("$.error.details.path").value("/test/protected-admin"));
    }

    @Test
    void insufficientRoleReturnsForbiddenErrorPayload() throws Exception {
        mockMvc.perform(get("/test/protected-admin")
                .header("X-Test-Role", "RIDER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.error.message").value("Access is denied."))
            .andExpect(jsonPath("$.error.details.path").value("/test/protected-admin"));
    }

    @Test
    void oversizedPageSizeReturnsValidationErrorBeforeControllerExecution() throws Exception {
        mockMvc.perform(get("/test/protected-admin")
                        .header("X-Test-Role", "TENANT_ADMIN")
                        .param("size", "1000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details.fieldErrors.size").exists());
    }
}
