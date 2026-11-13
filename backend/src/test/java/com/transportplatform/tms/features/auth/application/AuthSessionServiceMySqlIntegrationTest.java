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
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.companyapplication.application.TenantEmailVerificationService;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import com.transportplatform.tms.features.notification.application.NotificationDispatchService;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import com.transportplatform.tms.features.tenant.application.TenantMapper;
import com.transportplatform.tms.features.tenant.application.TenantResourceProvisioningService;
import com.transportplatform.tms.features.tenant.application.TenantService;
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
    @Autowired private CompanyApplicationRepository applicationRepository;
    @Autowired private TenantSettingsRepository settingsRepository;
    @Autowired private Clock clock;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    @Test
    void passwordSetupPersistsWorkspaceActivationBeforeSessionRevocationClearsEntities() {
        AppUser owner = saveUser("setup-tenant");
        Tenant tenant = tenantRepository.findById(owner.getTenantId()).orElseThrow();
        tenant.setStatus(TenantStatus.PENDING);
        String token = "A".repeat(43);
        owner.setMustChangePassword(true);
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerifiedAt(clock.instant().minusSeconds(60));
        owner.setEmailVerificationTokenHash(hash(token));
        owner.setEmailVerificationExpiresAt(clock.instant().plusSeconds(60));
        appUserRepository.saveAndFlush(owner);
        CompanyApplication application = new CompanyApplication();
        application.setApplicationNumber("APP-SETUP");
        application.setLegalCompanyName("Setup Transit");
        application.setContactFirstName("Test");
        application.setContactLastName("Applicant");
        application.setEmail(owner.getEmail());
        application.setPhone("5550100");
        application.setBusinessType("Transport");
        application.setAddressLine1("1 Main");
        application.setCity("Springfield");
        application.setState("IL");
        application.setZipCode("62701");
        application.setCountry("US");
        application.setStatus(CompanyApplicationStatus.APPROVED);
        application.setApprovedTenantId(owner.getTenantId());
        application.setOwnerUserId(owner.getId());
        application.setEmailVerifiedAt(clock.instant().minusSeconds(60));
        applicationRepository.saveAndFlush(application);
        var audit = org.mockito.Mockito.mock(AuditLogService.class);
        var tenantService = new TenantService(tenantRepository, new TenantMapper(), audit,
                new TenantResourceProvisioningService(settingsRepository, appUserRepository), authSessionService);
        var encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4);
        var setup = new TenantEmailVerificationService(appUserRepository, applicationRepository, tenantRepository,
                org.mockito.Mockito.mock(NotificationDispatchService.class), new AuthFlowProperties(), clock,
                encoder, authSessionService, audit, tenantService);
        var oldSession = authSessionService.issue(owner, "WEB");
        setup.verify(token, "New-setup-password");
        entityManager.flush();
        entityManager.clear();
        AppUser persisted = appUserRepository.findById(owner.getId()).orElseThrow();
        assertThat(tenantRepository.findById(owner.getTenantId()).orElseThrow().getStatus()).isEqualTo(TenantStatus.ACTIVE);
        assertThat(settingsRepository.existsById(owner.getTenantId())).isTrue();
        assertThat(persisted.isMustChangePassword()).isFalse();
        assertThat(encoder.matches("New-setup-password", persisted.getPasswordHash())).isTrue();
        assertThat(persisted.getEmailVerificationTokenHash()).isNull();
        assertThat(persisted.getPasswordChangedAt()).isEqualTo(clock.instant());
        assertThat(authRefreshSessionRepository.findByTokenHash(hash(oldSession.rawToken())).orElseThrow().getRevokedAt())
                .isNotNull();
        assertThatThrownBy(() -> setup.verify(token, "Replay-password")).isInstanceOf(ApiException.class);
    }

    @Test
    void newlyProvisionedOwnerCanBeSavedAgainForEmailVerification() {
        AppUser owner = saveUser("approval-owner");
        owner.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        appUserRepository.saveAndFlush(owner);
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerificationTokenHash("a".repeat(64));
        owner.setEmailVerificationExpiresAt(Instant.parse("2025-01-02T00:00:00Z"));
        appUserRepository.saveAndFlush(owner);
        entityManager.clear();
        AppUser persisted = appUserRepository.findById(owner.getId()).orElseThrow();
        assertThat(persisted.getRoles()).containsExactly(RoleName.ROLE_TENANT_ADMIN);
        assertThat(persisted.getEmailVerificationTokenHash()).isEqualTo("a".repeat(64));
        assertThat(persisted.getEmailVerificationEmail()).isEqualTo(owner.getEmail());
    }

    @Test
    void revokingLegacyWebSessionsPreservesMobileSessionsAndAccessVersion() {
        AppUser user = saveUser("mobile-only");
        var web = authSessionService.issue(user, "WEB");
        var mobile = authSessionService.issue(user, "MOBILE");
        authSessionService.revokeWebForUser(user.getId());
        entityManager.clear();
        assertThat(authRefreshSessionRepository.findByTokenHash(hash(web.rawToken())).orElseThrow().getRevokedAt())
                .isNotNull();
        assertThat(authRefreshSessionRepository.findByTokenHash(hash(mobile.rawToken())).orElseThrow().getRevokedAt())
                .isNull();
        assertThat(appUserRepository.findById(user.getId()).orElseThrow().getSecurityVersion()).isZero();
        assertThat(authSessionService.rotate(mobile.rawToken(), "MOBILE").user().getId()).isEqualTo(user.getId());
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
        assertThat(appUserRepository.findById(suspendedTenantUser.getId()).orElseThrow().getSecurityVersion()).isEqualTo(1L);
        assertThat(appUserRepository.findById(otherTenantUser.getId()).orElseThrow().getSecurityVersion()).isZero();
        assertThatThrownBy(() -> authSessionService.rotate(revokedToken.rawToken(), "WEB"))
                .isInstanceOf(ApiException.class)
                .hasMessage("The refresh session is invalid or expired.");
        assertThat(authSessionService.rotate(validToken.rawToken(), "MOBILE").user().getId())
                .isEqualTo(otherTenantUser.getId());
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void concurrentRefreshAllowsOneReplacementWithoutRevokingTheWinner() throws Exception {
        AppUser user = saveUser("race-" + UUID.randomUUID().toString().substring(0, 8));
        var token = authSessionService.issue(user, "MOBILE");
        var start = new java.util.concurrent.CountDownLatch(1);
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<String> rotate = () -> {
                start.await();
                try { return authSessionService.rotate(token.rawToken(), "MOBILE").token().rawToken(); }
                catch (ApiException denied) { return null; }
            };
            var one = executor.submit(rotate); var two = executor.submit(rotate); start.countDown();
            String first = one.get(30, java.util.concurrent.TimeUnit.SECONDS);
            String second = two.get(30, java.util.concurrent.TimeUnit.SECONDS);
            assertThat((first == null) != (second == null)).isTrue();
            String winner = first == null ? second : first;
            assertThat(authSessionService.rotate(winner, "MOBILE").user().getId()).isEqualTo(user.getId());
        }
    }

    @Test
    void replayOutsideTheOverlapWindowRevokesCompromisedSessions() {
        AppUser user = saveUser("replay-outside-window");
        var original = authSessionService.issue(user, "WEB");
        var replacement = authSessionService.rotate(original.rawToken(), "WEB").token();
        var stored = authRefreshSessionRepository.findByTokenHash(hash(original.rawToken())).orElseThrow();
        stored.setUsedAt(clock.instant().minusSeconds(6)); authRefreshSessionRepository.saveAndFlush(stored);
        assertThatThrownBy(() -> authSessionService.rotate(original.rawToken(), "WEB")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> authSessionService.rotate(replacement.rawToken(), "WEB")).isInstanceOf(ApiException.class);
    }

    @Test
    void administratorLocksRemainTenantScoped() {
        AppUser a = saveUser("lock-a"); AppUser b = saveUser("lock-b");
        assertThat(appUserRepository.lockActiveAdministrators("lock-a", RoleName.ROLE_TENANT_ADMIN, UserStatus.ACTIVE))
                .extracting(AppUser::getId).containsExactly(a.getId()).doesNotContain(b.getId());
        assertThat(appUserRepository.lockActiveAdministrators(null, RoleName.ROLE_PLATFORM_ADMIN, UserStatus.ACTIVE))
                .allSatisfy(user -> { assertThat(user.getTenantId()).isNull(); assertThat(user.getRoles()).contains(RoleName.ROLE_PLATFORM_ADMIN); });
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