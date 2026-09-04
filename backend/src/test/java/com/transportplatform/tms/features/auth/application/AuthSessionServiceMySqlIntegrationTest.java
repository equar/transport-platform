package com.transportplatform.tms.features.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.SecurityProperties;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.AuthRefreshSession;
import com.transportplatform.tms.features.auth.domain.AuthRefreshSessionRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
        JpaAuditConfig.class,
        AuthSessionService.class,
        AuthSessionServiceMySqlIntegrationTest.SessionTestConfiguration.class,
})
@Testcontainers
class AuthSessionServiceMySqlIntegrationTest {

    @TestConfiguration
    static class SessionTestConfiguration {
        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2025-01-01T00:00:00Z"), ZoneOffset.UTC);
        }

        @Bean
        SecurityProperties securityProperties() {
            return new SecurityProperties();
        }
    }

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @Autowired private AuthSessionService authSessionService;
    @Autowired private AuthRefreshSessionRepository authRefreshSessionRepository;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private EntityManager entityManager;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    @Test
    void revokesOnlyTheSuspendedTenantsSessions() {
        AppUser suspendedTenantUser = saveUser("tenant-a");
        AppUser otherTenantUser = saveUser("tenant-b");
        var revokedToken = authSessionService.issue(suspendedTenantUser, "WEB");
        var validToken = authSessionService.issue(otherTenantUser, "MOBILE");

        authSessionService.revokeAllForTenant("tenant-a");
        entityManager.clear();

        AuthRefreshSession revokedSession = authRefreshSessionRepository.findByTokenHash(hash(revokedToken.rawToken()))
                .orElseThrow();
        AuthRefreshSession validSession = authRefreshSessionRepository.findByTokenHash(hash(validToken.rawToken()))
                .orElseThrow();
        assertThat(revokedSession.getRevokedAt()).isEqualTo(Instant.parse("2025-01-01T00:00:00Z"));
        assertThat(validSession.getRevokedAt()).isNull();
        assertThatThrownBy(() -> authSessionService.rotate(revokedToken.rawToken(), "WEB"))
                .isInstanceOf(ApiException.class)
                .hasMessage("The refresh session is invalid or expired.");
        assertThat(authSessionService.rotate(validToken.rawToken(), "MOBILE").user().getId())
                .isEqualTo(otherTenantUser.getId());
    }

    private AppUser saveUser(String tenantId) {
        tenantRepository.saveAndFlush(tenant(tenantId));
        AppUser user = new AppUser();
        user.setTenantId(tenantId);
        user.setEmail(tenantId + "-user@example.com");
        user.setPasswordHash("password-hash");
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        return appUserRepository.saveAndFlush(user);
    }

    private Tenant tenant(String tenantId) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setTenantCode("code-" + UUID.randomUUID());
        tenant.setCompanyName("Example Transport " + tenantId);
        tenant.setLegalName("Example Transport LLC " + UUID.randomUUID());
        tenant.setEmail(tenantId + "@example.com");
        tenant.setPhone("555-0100");
        tenant.setAddressLine1("1 Operations Way");
        tenant.setCity("Springfield");
        tenant.setState("IL");
        tenant.setZipCode("62701");
        tenant.setCountry("US");
        tenant.setBusinessType("Transportation");
        tenant.setSubscriptionPlan("STANDARD");
        tenant.setStatus(TenantStatus.ACTIVE);
        return tenant;
    }

    private String hash(String rawToken) {
        try {
            return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}