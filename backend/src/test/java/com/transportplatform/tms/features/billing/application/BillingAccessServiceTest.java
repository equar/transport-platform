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

    private BillingAccessService service() {
        return new BillingAccessService(
                currentAuthenticatedUserService,
                pricingRuleRepository,
                invoiceRepository,
                invoiceLineItemRepository,
                paymentRepository,
                collectionNoteRepository);
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