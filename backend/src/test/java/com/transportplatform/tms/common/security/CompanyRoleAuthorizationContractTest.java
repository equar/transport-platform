package com.transportplatform.tms.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.billing.api.InvoiceManagementController;
import com.transportplatform.tms.features.compliance.api.ComplianceManagementController;
import com.transportplatform.tms.features.dispatch.api.DispatchManagementController;
import com.transportplatform.tms.features.driver.api.DriverManagementController;
import com.transportplatform.tms.features.incident.api.IncidentManagementController;
import com.transportplatform.tms.features.ride.api.RideManagementController;
import com.transportplatform.tms.features.vehicle.api.VehicleManagementController;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

class CompanyRoleAuthorizationContractTest {

    private static final Pattern ROLE_TOKEN_PATTERN = Pattern.compile("'([A-Z_]+)'");

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

    @Test
    void driverManagementEndpointsAuthorizeOperationalCompanyRoles() {
        assertEveryMethodAuthorizes(DriverManagementController.class, "TENANT_ADMIN");
        assertEveryMethodAuthorizes(DriverManagementController.class, "DISPATCHER");
        assertEveryMethodAuthorizes(DriverManagementController.class, "COMPLIANCE_ADMIN");
    }

    @Test
    void vehicleManagementEndpointsAuthorizeOperationalCompanyRoles() {
        assertEveryMethodAuthorizes(VehicleManagementController.class, "TENANT_ADMIN");
        assertEveryMethodAuthorizes(VehicleManagementController.class, "DISPATCHER");
        assertEveryMethodAuthorizes(VehicleManagementController.class, "COMPLIANCE_ADMIN");
    }

    @Test
    void rideManagementEndpointsAuthorizeDispatchRoles() {
        assertEveryMethodAuthorizes(RideManagementController.class, "TENANT_ADMIN");
        assertEveryMethodAuthorizes(RideManagementController.class, "DISPATCHER");
    }

    @Test
    void incidentManagementEndpointsAuthorizeComplianceRoles() {
        assertEveryMethodAuthorizes(IncidentManagementController.class, "TENANT_ADMIN");
        assertEveryMethodAuthorizes(IncidentManagementController.class, "COMPLIANCE_ADMIN");
    }

    @Test
    void companyManagementEndpointsDoNotAuthorizeEndUserRoles() {
        assertNoMethodAuthorizesAny(
                DriverManagementController.class,
                "DRIVER",
                "RIDER",
                "GUARDIAN",
                "ORGANIZATION_USER");
        assertNoMethodAuthorizesAny(
                VehicleManagementController.class,
                "DRIVER",
                "RIDER",
                "GUARDIAN",
                "ORGANIZATION_USER");
        assertNoMethodAuthorizesAny(
                RideManagementController.class,
                "DRIVER",
                "RIDER",
                "GUARDIAN",
                "ORGANIZATION_USER");
        assertNoMethodAuthorizesAny(
                IncidentManagementController.class,
                "DRIVER",
                "RIDER",
                "GUARDIAN",
                "ORGANIZATION_USER");
    }

    @Test
    void companyManagementEndpointsDoNotAuthorizeViewerOrPlatformAdminRoles() {
        assertNoMethodAuthorizesAny(
                DriverManagementController.class,
                "VIEWER",
                "PLATFORM_ADMIN");
        assertNoMethodAuthorizesAny(
                VehicleManagementController.class,
                "VIEWER",
                "PLATFORM_ADMIN");
        assertNoMethodAuthorizesAny(
                RideManagementController.class,
                "VIEWER",
                "PLATFORM_ADMIN");
        assertNoMethodAuthorizesAny(
                IncidentManagementController.class,
                "VIEWER",
                "PLATFORM_ADMIN");
    }

    @Test
    void companyManagementEndpointsUseOnlyDocumentedOperationalRoles() {
        assertEveryMethodAuthorizesOnlyRoles(
                DriverManagementController.class,
                Set.of("TENANT_ADMIN", "DISPATCHER", "COMPLIANCE_ADMIN"));
        assertEveryMethodAuthorizesOnlyRoles(
                VehicleManagementController.class,
                Set.of("TENANT_ADMIN", "DISPATCHER", "COMPLIANCE_ADMIN"));
        assertEveryMethodAuthorizesOnlyRoles(
                RideManagementController.class,
                Set.of("TENANT_ADMIN", "DISPATCHER"));
        assertEveryMethodAuthorizesOnlyRoles(
                IncidentManagementController.class,
                Set.of("TENANT_ADMIN", "COMPLIANCE_ADMIN"));
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

    private void assertNoMethodAuthorizesAny(Class<?> controllerType, String... disallowedRoles) {
        Method[] endpointMethods = Arrays.stream(controllerType.getDeclaredMethods())
                .filter(method -> method.isAnnotationPresent(PreAuthorize.class))
                .toArray(Method[]::new);

        assertThat(endpointMethods).isNotEmpty();
        for (String disallowedRole : disallowedRoles) {
            assertThat(endpointMethods)
                    .allSatisfy(method -> assertThat(method.getAnnotation(PreAuthorize.class).value())
                            .as("authorization for %s.%s", controllerType.getSimpleName(), method.getName())
                            .doesNotContain(disallowedRole));
        }
    }

    private void assertEveryMethodAuthorizesOnlyRoles(Class<?> controllerType, Set<String> allowedRoles) {
        Method[] endpointMethods = Arrays.stream(controllerType.getDeclaredMethods())
                .filter(method -> method.isAnnotationPresent(PreAuthorize.class))
                .toArray(Method[]::new);

        assertThat(endpointMethods).isNotEmpty();
        assertThat(endpointMethods)
                .allSatisfy(method -> {
                    Set<String> roles = extractRoles(method);
                    assertThat(roles)
                            .as("roles used by %s.%s", controllerType.getSimpleName(), method.getName())
                            .isNotEmpty()
                            .isSubsetOf(allowedRoles);
                });
    }

    private Set<String> extractRoles(Method method) {
        String expression = method.getAnnotation(PreAuthorize.class).value();
        Matcher matcher = ROLE_TOKEN_PATTERN.matcher(expression);
        Set<String> roles = new LinkedHashSet<>();
        while (matcher.find()) {
            roles.add(matcher.group(1));
        }
        return roles;
    }
}
