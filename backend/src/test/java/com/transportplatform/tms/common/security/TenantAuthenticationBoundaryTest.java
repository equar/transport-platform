package com.transportplatform.tms.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.tenant.*;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Clock;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TenantAuthenticationBoundaryTest {
    AppUserRepository users = mock(AppUserRepository.class);
    TenantRepository tenants = mock(TenantRepository.class);
    SecurityProperties properties = new SecurityProperties();
    JwtService tokens;
    JwtAuthenticationFilter filter;
    AppUser user;
    Tenant tenant;
    @BeforeEach void setup() {
        properties.getJwt().setSecret("tenant-isolation-test-signing-key-at-least-32-bytes-long");
        tokens = new JwtService(properties, Clock.systemUTC());
        filter = new JwtAuthenticationFilter(tokens, tenants, users, new TenantProperties(), new RestAccessDeniedHandler(new ObjectMapper().findAndRegisterModules()));
        user = new AppUser(); ReflectionTestUtils.setField(user, "id", 1L);
        user.setTenantId("tenant-a"); user.setEmail("admin@example.test"); user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        tenant = new Tenant(); tenant.setId("tenant-a"); tenant.setStatus(TenantStatus.ACTIVE);
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(tenants.findById("tenant-a")).thenReturn(Optional.of(tenant));
    }
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); TenantContext.clear(); }
    String token() {
        return tokens.generateAccessToken(new AuthenticatedUser(1L, user.getTenantId(), user.getEmail(), "A", "User", "", true, true,
                user.isMustChangePassword(), user.getRoles().stream().map(r -> new SimpleGrantedAuthority(r.name())).toList(), user.getSecurityVersion()));
    }
    MockHttpServletResponse request(String token, String header, String path) throws Exception {
        var request = new MockHttpServletRequest("GET", path);
        request.addHeader("Authorization", "Bearer " + token);
        if (header != null) request.addHeader("X-Tenant-Id", header);
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> {
            var principal = SecurityContextHolder.getContext().getAuthentication();
            if (principal == null) ((jakarta.servlet.http.HttpServletResponse) res).setStatus(401);
            else assertEquals(user.getTenantId(), TenantContext.getTenantId().orElse(null));
        });
        assertTrue(TenantContext.getTenantId().isEmpty(), "Tenant must not survive the request");
        return response;
    }
    @Test void ownTenantWorksAndForgedHeaderIsDenied() throws Exception {
        assertEquals(200, request(token(), "tenant-a", "/company/rides").getStatus());
        SecurityContextHolder.clearContext();
        assertEquals(403, request(token(), "tenant-b", "/company/rides").getStatus());
    }
    @Test void platformAdministratorCannotSelectAnOperationalTenantByHeader() throws Exception {
        user.setTenantId(null); user.setRoles(Set.of(RoleName.ROLE_PLATFORM_ADMIN));
        assertEquals(403, request(token(), "tenant-b", "/platform/tenants").getStatus());
    }
    @Test void versionChangeImmediatelyRejectsAlreadyIssuedJwt() throws Exception {
        String previous = token(); ReflectionTestUtils.setField(user, "securityVersion", 1L);
        assertEquals(401, request(previous, null, "/company/rides").getStatus());
        assertEquals(200, request(token(), null, "/company/rides").getStatus());
    }
    @Test void roleChangeRejectsStaleAuthorityClaims() throws Exception {
        String previous = token(); user.setRoles(Set.of(RoleName.ROLE_DISPATCHER));
        assertEquals(401, request(previous, null, "/company/rides").getStatus());
    }
    @Test void tenantMoveInvalidatesOldJwt() throws Exception {
        String previous = token(); user.setTenantId("tenant-b");
        assertEquals(401, request(previous, null, "/company/rides").getStatus());
    }
    @Test void suspendedTenantCannotUseExistingJwt() throws Exception {
        String previous = token(); tenant.setStatus(TenantStatus.SUSPENDED);
        assertEquals(401, request(previous, null, "/company/rides").getStatus());
    }
    @Test void suspendedUserCannotUseExistingJwt() throws Exception {
        String previous = token(); user.setStatus(UserStatus.SUSPENDED);
        assertEquals(401, request(previous, null, "/company/rides").getStatus());
    }
    @Test void temporaryPasswordCannotAccessOperationsButCanBeReplaced() throws Exception {
        user.setMustChangePassword(true);
        assertEquals(403, request(token(), null, "/company/rides").getStatus());
        assertEquals(200, request(token(), null, "/v1/auth/change-password").getStatus());
    }
    @Test void expiredTemporaryPasswordCannotUseAlreadyIssuedJwt() throws Exception {
        user.setMustChangePassword(true);
        user.setTemporaryPasswordExpiresAt(java.time.Instant.now().minusSeconds(1));
        assertEquals(401, request(token(), null, "/v1/auth/change-password").getStatus());
    }
    @Test void anonymousHeaderNeverEstablishesTenantContext() throws Exception {
        var request = new MockHttpServletRequest(); request.addHeader("X-Tenant-Id", "tenant-b");
        new TenantContextFilter(new TenantProperties()).doFilter(request, new MockHttpServletResponse(),
                (req, res) -> assertTrue(TenantContext.getTenantId().isEmpty()));
        assertTrue(TenantContext.getTenantId().isEmpty());
    }
    @Test void exceptionCannotLeakContextToTheNextRequest() {
        assertThrows(jakarta.servlet.ServletException.class, () -> {
            var request = new MockHttpServletRequest("GET", "/company/rides"); request.addHeader("Authorization", "Bearer " + token());
            filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> { throw new jakarta.servlet.ServletException("test"); });
        });
        assertTrue(TenantContext.getTenantId().isEmpty());
    }
}
