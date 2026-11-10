package com.transportplatform.tms.features.riderguardianportal.api;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.features.riderguardianportal.application.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

class AssignmentOnlyPortalTest {
    @AfterEach void clearSecurity() { SecurityContextHolder.clearContext(); }
    @Test void riderAndGuardianCannotCreateTripsThroughTheLegacyEndpoint() {
        var service = mock(RiderGuardianPortalService.class);
        var bookings = mock(PortalBookingIdempotencyService.class);
        var factory = new ProxyFactory(new RiderGuardianPortalController(service, bookings));
        factory.setProxyTargetClass(true);
        factory.addAdvice(AuthorizationManagerBeforeMethodInterceptor.preAuthorize());
        var controller = (RiderGuardianPortalController) factory.getProxy();
        for (String role : new String[]{"ROLE_RIDER", "ROLE_GUARDIAN"}) {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("portal-user", "", AuthorityUtils.createAuthorityList(role)));
            assertThrows(AccessDeniedException.class, () -> controller.createRide(null, "legacy-request"));
        }
        verifyNoInteractions(service, bookings);
    }
}
