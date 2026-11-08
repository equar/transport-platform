package com.transportplatform.tms.features.branding.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.compliance.domain.*;
import com.transportplatform.tms.features.settings.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaAuditConfig.class)
@Testcontainers
class TenantThemeMySqlIntegrationTest {
    @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl); registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword); registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }
    @Autowired TenantRepository tenants;
    @Autowired TenantSettingsRepository settings;
    @Autowired TenantTransportComplianceRepository compliance;
    @Autowired EntityManager entityManager;
    @Test void selectedThemePersistsForOnlyTheTargetTenantAndResetPreservesLogo() {
        createTenant("brand-a"); createTenant("brand-b");
        var current = mock(CurrentAuthenticatedUserService.class);
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(1L, null, "admin@example.com", "Admin", "", "", true, true, false,
                List.of(new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"))));
        var service = new TenantBrandingService(current, tenants, settings, compliance, mock(AuditLogService.class));
        service.apply("brand-a", "FOREST");
        entityManager.flush(); entityManager.clear();
        assertEquals("FOREST", service.get("brand-a").selectedCode());
        assertEquals("DEFAULT", service.get("brand-b").selectedCode());
        var row = settings.findById("brand-a").orElseThrow(); row.setCompanyLogoUrl("https://example.com/logo.png"); settings.saveAndFlush(row);
        service.apply("brand-a", "DEFAULT"); entityManager.flush(); entityManager.clear();
        row = settings.findById("brand-a").orElseThrow();
        assertNull(row.getPrimaryColor()); assertNull(row.getSecondaryColor()); assertNull(row.getAccentColor());
        assertEquals("https://example.com/logo.png", row.getCompanyLogoUrl());
    }
    private void createTenant(String id) {
        Tenant tenant = new Tenant(); tenant.setId(id); tenant.setTenantCode(id); tenant.setCompanyName(id);
        tenant.setLegalName(id + " LLC"); tenant.setEmail(id + "@example.com"); tenant.setPhone("555-0100");
        tenant.setAddressLine1("1 Transit Way"); tenant.setCity("Boston"); tenant.setState("MA"); tenant.setZipCode("02110");
        tenant.setCountry("US"); tenant.setBusinessType("Transportation"); tenant.setSubscriptionPlan("STANDARD"); tenant.setStatus(TenantStatus.ACTIVE);
        tenants.saveAndFlush(tenant);
        var profile = new TenantTransportCompliance(); profile.setTenantId(id); profile.setOperatingScope(TransportOperatingScope.WORKFORCE_ONLY);
        profile.setPrimaryState("MA"); profile.setVerificationStatus(TransportVerificationStatus.VERIFIED); compliance.saveAndFlush(profile);
    }
}
