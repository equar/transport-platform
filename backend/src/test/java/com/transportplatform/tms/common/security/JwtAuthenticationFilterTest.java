package com.transportplatform.tms.common.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.tenant.TenantContext;
import com.transportplatform.tms.common.tenant.TenantProperties;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Test
    void rejectsRequestsWhenHeaderTenantDoesNotMatchTokenTenant() throws Exception {
        TenantProperties tenantProperties = new TenantProperties();
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService,
                tenantProperties,
                new SecurityFailureResponseWriter(new ObjectMapper()));
        when(jwtService.parseAccessToken("access-token")).thenReturn(new JwtClaims(
                5L,
                "ops@example.com",
                "Alex",
                "Morgan",
                "tenant-a",
                Set.of("ROLE_TENANT_ADMIN"),
                "ACCESS",
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:15:00Z")));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer access-token");
        request.addHeader(tenantProperties.getHeaderName(), "tenant-b");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("FORBIDDEN"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(TenantContext.getTenantId().isEmpty());
    }

    @Test
    void acceptsRequestsWhenHeaderTenantMatchesTokenTenant() throws Exception {
        TenantProperties tenantProperties = new TenantProperties();
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService,
                tenantProperties,
                new SecurityFailureResponseWriter(new ObjectMapper()));
        when(jwtService.parseAccessToken("access-token")).thenReturn(new JwtClaims(
                5L,
                "ops@example.com",
                "Alex",
                "Morgan",
                "tenant-a",
                Set.of("ROLE_TENANT_ADMIN"),
                "ACCESS",
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:15:00Z")));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer access-token");
        request.addHeader(tenantProperties.getHeaderName(), "tenant-a");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(200, response.getStatus());
        assertEquals("tenant-a", TenantContext.getTenantId().orElseThrow());
        assertEquals("ops@example.com", SecurityContextHolder.getContext().getAuthentication().getName());
    }
}