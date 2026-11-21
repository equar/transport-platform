package com.transportplatform.tms.common.security;
import com.transportplatform.tms.features.saas.application.TenantModulePolicy;
import com.transportplatform.tms.common.exception.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class TenantModuleAccessFilterTest {
    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(strings={"/company/drivers","/company/dispatch","/company/invoices","/portal/driver/rides/1","/portal/rider/rides/1","/notifications","/runtime/tenant-capabilities"})
    void unavailableSubscriptionBlocksExistingAuthenticatedSessionForEveryModule(String path) throws Exception {
        var policy=mock(TenantModulePolicy.class);
        var access=mock(com.transportplatform.tms.features.saas.application.TenantEntitlementService.class);
        doThrow(new ApiException(ErrorCode.FORBIDDEN,HttpStatus.FORBIDDEN,"expired")).when(access).requireOperational("tenant-a");
        var filter=new TenantModuleAccessFilter(policy,new RestAccessDeniedHandler(new ObjectMapper().findAndRegisterModules()));
        org.springframework.test.util.ReflectionTestUtils.setField(filter,"entitlements",access);
        var principal=new AuthenticatedUser(7L,"tenant-a","test@example.test","A","User","",true,true,false,List.of());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,List.of()));
        try {
            var response=new MockHttpServletResponse();
            filter.doFilter(new MockHttpServletRequest("GET",path),response,(a,b)->fail("Subscription denial must stop API access"));
            assertEquals(403,response.getStatus());
            assertTrue(response.getContentAsString().contains("Subscription access is unavailable"));
            verifyNoInteractions(policy);
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void encodedApiPathStillEnforcesTheAuthenticatedTenantsModulePolicy() throws Exception {
        var policy = mock(TenantModulePolicy.class);
        doThrow(new ApiException(ErrorCode.FORBIDDEN,HttpStatus.FORBIDDEN,"disabled")).when(policy).requireEnabled("tenant-a","BILLING");
        var principal = new AuthenticatedUser(7L,"tenant-a","a@example.test","A","User","",true,true,false,List.of());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,List.of()));
        try {
            var req = new MockHttpServletRequest("GET", "/company/%69nvoices/9"); req.addHeader("X-Tenant-Id","tenant-b");
            var res = new MockHttpServletResponse();
            var filter = new TenantModuleAccessFilter(policy,new RestAccessDeniedHandler(new ObjectMapper().findAndRegisterModules()));
            org.springframework.test.util.ReflectionTestUtils.setField(filter,"entitlements",mock(com.transportplatform.tms.features.saas.application.TenantEntitlementService.class));
            filter.doFilter(req,res,(a,b)->fail("Disabled module must not reach the controller"));
            assertEquals(403,res.getStatus()); verify(policy).requireEnabled("tenant-a","BILLING");
        } finally { SecurityContextHolder.clearContext(); }
    }
}
