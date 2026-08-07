package com.transportplatform.tms.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.billing.api.InvoiceManagementController;
import com.transportplatform.tms.features.compliance.api.ComplianceManagementController;
import com.transportplatform.tms.features.dispatch.api.DispatchManagementController;
import java.lang.reflect.Method;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

class CompanyRoleAuthorizationContractTest {

    @Test
    void advertisedCompanyRolesExistInTheBackendRoleCatalog() {
        assertThat(RoleName.values()).contains(
                RoleName.ROLE_DISPATCHER,
                RoleName.ROLE_BILLING_ADMIN,
                RoleName.ROLE_COMPLIANCE_ADMIN);
    }

    @Test
    void dispatcherEndpointsAuthorizeDispatchers() {
        assertEveryMethodAuthorizes(DispatchManagementController.class, "DISPATCHER");
    }

    @Test
    void billingEndpointsAuthorizeBillingAdmins() {
        assertEveryMethodAuthorizes(InvoiceManagementController.class, "BILLING_ADMIN");
    }

    @Test
    void complianceEndpointsAuthorizeComplianceAdmins() {
        assertEveryMethodAuthorizes(ComplianceManagementController.class, "COMPLIANCE_ADMIN");
    }

    private void assertEveryMethodAuthorizes(Class<?> controllerType, String role) {
        Method[] endpointMethods = Arrays.stream(controllerType.getDeclaredMethods())
                .filter(method -> method.isAnnotationPresent(PreAuthorize.class))
                .toArray(Method[]::new);

        assertThat(endpointMethods).isNotEmpty();
        assertThat(endpointMethods)
                .allSatisfy(method -> assertThat(method.getAnnotation(PreAuthorize.class).value())
                        .as("authorization for %s.%s", controllerType.getSimpleName(), method.getName())
                        .contains(role));
    }
}
