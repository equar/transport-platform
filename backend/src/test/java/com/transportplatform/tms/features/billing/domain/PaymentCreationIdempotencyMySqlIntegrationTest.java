package com.transportplatform.tms.features.billing.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaAuditConfig.class)
@Testcontainers
class PaymentCreationIdempotencyMySqlIntegrationTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @Autowired private TenantRepository tenantRepository;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private PaymentCreationIdempotencyRepository repository;
    @Autowired private PlatformTransactionManager transactionManager;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    @Test
    void repeatedClaimIsRejectedOnlyForTheSameTenantUserAndKey() {
        String tenantId = UUID.randomUUID().toString();
        AppUser firstUser = saveUser(tenantId, "first@example.com");
        AppUser secondUser = saveUser(tenantId, "second@example.com");
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");

        int firstClaim = repository.claim(tenantId, firstUser.getId(), "payment-claim-1", "request-hash", createdAt);
        int replayClaim = repository.claim(tenantId, firstUser.getId(), "payment-claim-1", "request-hash", createdAt);
        int secondUserClaim = repository.claim(tenantId, secondUser.getId(), "payment-claim-1", "request-hash", createdAt);

        assertThat(firstClaim).isEqualTo(1);
        assertThat(replayClaim).isZero();
        assertThat(secondUserClaim).isEqualTo(1);
        assertThat(repository.findByTenantIdAndUserIdAndIdempotencyKey(
                tenantId, firstUser.getId(), "payment-claim-1")).isPresent();
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void concurrentClaimsAllowOnlyTheTransactionThatInsertedTheKeyToProceed() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        AppUser user = saveUser(tenantId, "concurrent@example.com");
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");
        CountDownLatch firstClaimed = new CountDownLatch(1);
        CountDownLatch secondStarted = new CountDownLatch(1);
        CountDownLatch releaseFirstTransaction = new CountDownLatch(1);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<Integer> firstClaim = executor.submit(() -> transactionTemplate.execute(status -> {
                int result = repository.claim(tenantId, user.getId(), "payment-claim-concurrent", "request-hash",
                        createdAt);
                firstClaimed.countDown();
                await(releaseFirstTransaction);
                return result;
            }));

            assertThat(firstClaimed.await(5, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            Future<Integer> secondClaim = executor.submit(() -> transactionTemplate.execute(status -> {
                secondStarted.countDown();
                return repository.claim(tenantId, user.getId(), "payment-claim-concurrent", "request-hash", createdAt);
            }));

            assertThat(secondStarted.await(5, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            releaseFirstTransaction.countDown();

            assertThat(firstClaim.get()).isEqualTo(1);
            assertThat(secondClaim.get()).isZero();
        }
    }

    private void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while coordinating concurrent claim test.", exception);
        }
    }

    private AppUser saveUser(String tenantId, String email) {
        if (!tenantRepository.existsById(tenantId)) {
            Tenant tenant = new Tenant();
            tenant.setId(tenantId);
            tenant.setTenantCode("tenant-" + UUID.randomUUID());
            tenant.setCompanyName("Example Transport");
            tenant.setLegalName("Example Transport LLC " + UUID.randomUUID());
            tenant.setEmail("operations@example.com");
            tenant.setPhone("555-0100");
            tenant.setAddressLine1("1 Operations Way");
            tenant.setCity("Springfield");
            tenant.setState("IL");
            tenant.setZipCode("62701");
            tenant.setCountry("US");
            tenant.setBusinessType("Transportation");
            tenant.setSubscriptionPlan("STANDARD");
            tenant.setStatus(TenantStatus.ACTIVE);
            tenantRepository.saveAndFlush(tenant);
        }
        AppUser user = new AppUser();
        user.setTenantId(tenantId);
        user.setEmail(email);
        user.setPasswordHash("not-used-by-integration-test");
        user.setStatus(UserStatus.ACTIVE);
        return appUserRepository.saveAndFlush(user);
    }
}