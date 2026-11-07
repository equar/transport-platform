package com.transportplatform.tms.common.security;
import com.transportplatform.tms.features.auth.api.AuthController;
import com.transportplatform.tms.features.auth.application.AuthFacade;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.common.tenant.*;
import com.transportplatform.tms.common.observability.RequestCorrelationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class,JwtAuthenticationFilter.class,TenantContextFilter.class,RequestCorrelationFilter.class,
    AuthRateLimitFilter.class,RestAuthenticationEntryPoint.class,RestAccessDeniedHandler.class})
@EnableConfigurationProperties({SecurityProperties.class,TenantProperties.class})
class PasswordRecoverySecurityTest {
    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private com.transportplatform.tms.features.saas.application.TenantModulePolicy tenantModulePolicy;
    @Autowired MockMvc mvc;
    @MockitoBean AuthFacade auth;
    @MockitoBean JwtService jwt;
    @MockitoBean AppUserRepository users;
    @MockitoBean TenantRepository tenants;
    @Test void signedOutUsersCanRequestRecoveryAndRedeemReset() throws Exception {
        when(auth.requestPasswordReset(any())).thenReturn("If an account exists, instructions will be sent.");
        when(auth.resetPassword(any())).thenReturn("Password reset successfully.");
        mvc.perform(post("/v1/auth/forgot-password").contentType("application/json").content("{\"email\":\"test@example.com\"}")).andExpect(status().isOk());
        mvc.perform(post("/v1/auth/reset-password").contentType("application/json").content("{\"token\":\"valid-token\",\"password\":\"a-long-password123\"}")).andExpect(status().isOk());
    }
    @Test void passwordChangesStillRequireAuthentication() throws Exception {
        mvc.perform(post("/v1/auth/change-password").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
    }
}
