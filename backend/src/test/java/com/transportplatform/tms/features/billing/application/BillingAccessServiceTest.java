package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.billing.domain.CollectionNoteRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItemRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PricingRuleRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class BillingAccessServiceTest {

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private PricingRuleRepository pricingRuleRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceLineItemRepository invoiceLineItemRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CollectionNoteRepository collectionNoteRepository;

    @Test
    void requireCompanyTenantIdAcceptsBillingAdministratorRole() {
        BillingAccessService service = service();
        when(currentAuthenticatedUserService.requireCurrentUser())
                .thenReturn(user("tenant-a", RoleName.ROLE_BILLING_ADMIN));

        String tenantId = service.requireCompanyTenantId();

        assertEquals("tenant-a", tenantId);
    }

    @Test
    void requireCompanyTenantIdRejectsRoleOutsideBillingAdministration() {
        BillingAccessService service = service();
        when(currentAuthenticatedUserService.requireCurrentUser())
                .thenReturn(user("tenant-a", RoleName.ROLE_DISPATCHER));

        ApiException exception = assertThrows(ApiException.class, service::requireCompanyTenantId);

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    @Test void serviceBoundaryRejectsBillingEvenWhenTheCallerBypassesRouteGuards() {
        var service=service();
        when(currentAuthenticatedUserService.requireCurrentUser()).thenReturn(user("tenant-a",RoleName.ROLE_BILLING_ADMIN));
        var modules=org.mockito.Mockito.mock(com.transportplatform.tms.features.saas.application.TenantModulePolicy.class);
        org.springframework.test.util.ReflectionTestUtils.setField(service,"modules",modules);
        org.mockito.Mockito.doThrow(new ApiException(com.transportplatform.tms.common.exception.ErrorCode.FORBIDDEN,org.springframework.http.HttpStatus.FORBIDDEN,"Billing disabled"))
            .when(modules).requireEnabled("tenant-a","BILLING");
        assertThrows(ApiException.class,service::requireCompanyTenantId);
    }

    private BillingAccessService service() {
        var service = new BillingAccessService(
                currentAuthenticatedUserService,
                pricingRuleRepository,
                invoiceRepository,
                invoiceLineItemRepository,
                paymentRepository,
                collectionNoteRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(service,"modules", org.mockito.Mockito.mock(com.transportplatform.tms.features.saas.application.TenantModulePolicy.class));
        return service;
    }

    private AuthenticatedUser user(String tenantId, RoleName role) {
        return new AuthenticatedUser(
                1L,
                tenantId,
                "billing@example.com",
                "Billing",
                "User",
                "secret",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(role.name())));
    }
}