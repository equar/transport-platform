package com.transportplatform.tms.features.billing.domain;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.features.billing.application.*;
import com.transportplatform.tms.features.billing.api.request.*;
import org.springframework.boot.test.mock.mockito.MockBean;

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

@DataJpaTest(properties = {"spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({JpaAuditConfig.class, InvoiceService.class, InvoiceMapper.class, InvoiceFinancialService.class,
    InvoiceGenerationIdempotencyService.class, InvoiceGenerationIdempotencyMySqlIntegrationTest.Config.class})
@Testcontainers
class InvoiceGenerationIdempotencyMySqlIntegrationTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @org.springframework.boot.test.context.TestConfiguration
    static class Config {
        @org.springframework.context.annotation.Bean java.time.Clock clock() { return java.time.Clock.systemUTC(); }
    }
    @Autowired private InvoiceService service;
    @Autowired private InvoiceRepository invoices;
    @Autowired private InvoiceLineItemRepository lines;
    @MockBean private BillingAccessService access;
    @MockBean private BillingReferenceValidationService references;
    @MockBean private BillingCalculationService calculations;
    @MockBean private InvoiceNumberGenerator numbers;
    @MockBean private com.transportplatform.tms.features.audit.application.AuditLogService audit;
    @MockBean private com.transportplatform.tms.features.notification.application.NotificationEventService notifications;
    @MockBean private com.transportplatform.tms.features.driverearnings.application.DriverEarningsService earnings;
    @MockBean private com.transportplatform.tms.features.settings.application.TenantTimeService time;
    @MockBean private com.transportplatform.tms.common.security.CurrentAuthenticatedUserService currentUser;
    @Autowired private org.springframework.jdbc.core.JdbcTemplate db;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private InvoiceGenerationIdempotencyRepository repository;
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

        int firstClaim = repository.claim(tenantId, firstUser.getId(), "invoice-claim-1", "request-hash", createdAt);
        int replayClaim = repository.claim(tenantId, firstUser.getId(), "invoice-claim-1", "request-hash", createdAt);
        int secondUserClaim = repository.claim(tenantId, secondUser.getId(), "invoice-claim-1", "request-hash", createdAt);

        assertThat(firstClaim).isEqualTo(1);
        assertThat(replayClaim).isZero();
        assertThat(secondUserClaim).isEqualTo(1);
        assertThat(repository.findByTenantIdAndUserIdAndIdempotencyKey(
                tenantId, firstUser.getId(), "invoice-claim-1")).isPresent();
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
            try {
                Future<Integer> firstClaim = executor.submit(() -> transactionTemplate.execute(status -> {
                    int result = repository.claim(tenantId, user.getId(), "invoice-claim-concurrent", "request-hash",
                            createdAt);
                    firstClaimed.countDown();
                    await(releaseFirstTransaction);
                    return result;
                }));

                assertThat(firstClaimed.await(5, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
                Future<Integer> secondClaim = executor.submit(() -> transactionTemplate.execute(status -> {
                    secondStarted.countDown();
                    return repository.claim(tenantId, user.getId(), "invoice-claim-concurrent", "request-hash", createdAt);
                }));

                assertThat(secondStarted.await(5, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
                releaseFirstTransaction.countDown();

                assertThat(firstClaim.get(10, java.util.concurrent.TimeUnit.SECONDS)).isEqualTo(1);
                assertThat(secondClaim.get(10, java.util.concurrent.TimeUnit.SECONDS)).isZero();
            } finally {
                releaseFirstTransaction.countDown();
            }
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void databaseClaimsFollowVoidEditsAndDeletesAndProtectConcurrentWriters() throws Exception {
        String tenant = UUID.randomUUID().toString();
        saveUser(tenant, "rides@example.com");
        long first = invoice(tenant), second = invoice(tenant);
        line(tenant, first, 1, "RIDE", 10L);
        assertThat(org.assertj.core.api.Assertions.catchThrowable(() -> line(tenant, second, 1, "RIDE", 10L)))
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            db.update("UPDATE invoices SET status='VOID' WHERE id=?", first);
            db.update("UPDATE invoice_line_items SET ride_claim_active=FALSE WHERE invoice_id=?", first);
        });
        line(tenant, second, 1, "RIDE", 10L);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM invoice_line_items WHERE source_reference_id=10 AND tenant_id=?", Long.class, tenant)).isEqualTo(2);
        db.update("UPDATE invoice_line_items SET source_reference_id=11 WHERE invoice_id=?", second);
        long third = invoice(tenant);
        line(tenant, third, 1, "RIDE", 10L);
        db.update("DELETE FROM invoice_line_items WHERE invoice_id=?", third);
        line(tenant, third, 1, "RIDE", 10L);
        line(tenant, third, 2, "MANUAL", 10L);
        line(tenant, third, 3, "MANUAL", 10L);
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a = executor.submit(() -> { await(start); return tryLine(tenant, second, 2, 99L); });
            var b = executor.submit(() -> { await(start); return tryLine(tenant, third, 4, 99L); });
            start.countDown();
            assertThat(java.util.List.of(a.get(10, java.util.concurrent.TimeUnit.SECONDS), b.get(10, java.util.concurrent.TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(true, false);
        }
        String other = UUID.randomUUID().toString();
        saveUser(other, "other@example.com");
        line(other, invoice(other), 1, "RIDE", 10L);
        assertThat(org.assertj.core.api.Assertions.catchThrowable(() -> line(other, second, 6, "RIDE", 300L)))
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(org.assertj.core.api.Assertions.catchThrowable(() -> line(tenant, second, 7, "RIDE", null)))
            .isInstanceOf(org.springframework.dao.DataAccessException.class);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void rolledBackGenerationClaimCanBeRetried() {
        String tenant = UUID.randomUUID().toString();
        var user = saveUser(tenant, "rollback@example.com");
        var tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            assertThat(repository.claim(tenant, user.getId(), "rollback", "hash", Instant.now())).isEqualTo(1);
            status.setRollbackOnly();
        });
        tx.executeWithoutResult(status ->
            assertThat(repository.claim(tenant, user.getId(), "rollback", "hash", Instant.now())).isEqualTo(1));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void serviceReplayConflictsVoidAndRollbackKeepFinancialHistoryConsistent() {
        String tenant = UUID.randomUUID().toString();
        var user = saveUser(tenant, "workflow@example.com");
        when(access.requireCompanyTenantId()).thenReturn(tenant);
        when(time.today(tenant)).thenReturn(java.time.LocalDate.of(2026, 11, 20));
        when(currentUser.requireCurrentUser()).thenReturn(new com.transportplatform.tms.common.security.AuthenticatedUser(
            user.getId(), tenant, user.getEmail(), "Test", "User", "unused", true, true, false, java.util.List.of()));
        when(numbers.generate(tenant)).thenAnswer(invocation -> UUID.randomUUID().toString());
        when(references.resolveBillTo(tenant, BillToType.RIDER, 1L)).thenReturn(
            new BillingReferenceValidationService.ResolvedBillTo(BillToType.RIDER, 1L, "Test", null, null, null, null));
        when(access.findInvoiceForCompanyScope(anyLong())).thenAnswer(invocation -> invoices.findById(invocation.getArgument(0)).orElseThrow());
        var request = generation(800L);
        var first = service.generateManualInvoice(request, "workflow-key");
        var replay = service.generateManualInvoice(request, "workflow-key");
        assertThat(replay.id()).isEqualTo(first.id());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM invoices WHERE tenant_id=?", Long.class, tenant)).isEqualTo(1);
        assertThatThrownBy(() -> service.generateManualInvoice(generation(801L), "workflow-key"))
            .isInstanceOf(com.transportplatform.tms.common.exception.ApiException.class).hasMessageContaining("different invoice");
        assertThatThrownBy(() -> service.generateManualInvoice(request, "other-key"))
            .isInstanceOf(com.transportplatform.tms.common.exception.ApiException.class).hasMessageContaining("already included");
        service.voidCompanyInvoice(first.id(), new VoidInvoiceRequest("Correct and rebill"));
        var replacement = service.generateManualInvoice(request, "other-key");
        assertThat(replacement.id()).isNotEqualTo(first.id());
        assertThat(service.generateManualInvoice(request, "workflow-key").status()).isEqualTo(InvoiceStatus.VOID);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM invoice_line_items WHERE tenant_id=? AND active_ride_id=800", Long.class, tenant)).isEqualTo(1);
        doThrow(new IllegalStateException("Simulated transaction failure")).when(audit).record(any());
        assertThatThrownBy(() -> service.generateManualInvoice(generation(802L), "rollback-key"))
            .hasMessageContaining("Simulated transaction failure");
        reset(audit);
        service.generateManualInvoice(generation(802L), "rollback-key");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM invoices WHERE tenant_id=?", Long.class, tenant)).isEqualTo(3);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM invoice_generation_idempotency WHERE tenant_id=?", Long.class, tenant)).isEqualTo(3);
    }

    private ManualInvoiceGenerationRequest generation(long ride) {
        var item = new InvoiceLineItemUpsertRequest("Test ride", ChargeSourceType.RIDE, ride, null,
            java.math.BigDecimal.ONE, java.math.BigDecimal.TEN, null, null, null);
        return new ManualInvoiceGenerationRequest(BillToType.RIDER, 1L, null, null, null, null, null,
            null, null, null, null, null, java.time.LocalDate.of(2026, 11, 20), java.time.LocalDate.of(2026, 12, 20),
            "USD", java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, null, null, null, java.util.List.of(item));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void batchClaimsIgnoreVoidsOtherTenantsAndCurrentLines() {
        String tenant=UUID.randomUUID().toString(); saveUser(tenant,"batch@example.com");
        long old=invoice(tenant), active=invoice(tenant);
        line(tenant,old,1,"RIDE",10L);
        db.update("UPDATE invoices SET status='VOID' WHERE id=?",old);
        db.update("UPDATE invoice_line_items SET ride_claim_active=FALSE WHERE invoice_id=?",old);
        line(tenant,active,1,"RIDE",10L); line(tenant,active,2,"RIDE",20L);
        assertThat(lines.findConflictingRideIds(tenant,java.util.List.of(10L,20L,30L),java.util.List.of(-1L)))
            .containsExactlyInAnyOrder(10L,20L);
        var current=db.queryForList("SELECT id FROM invoice_line_items WHERE invoice_id=?",Long.class,active);
        assertThat(lines.findConflictingRideIds(tenant,java.util.List.of(10L,20L),current)).isEmpty();
        assertThat(lines.findConflictingRideIds("other",java.util.List.of(10L,20L),java.util.List.of(-1L))).isEmpty();
    }

    private boolean tryLine(String tenant, long invoice, int number, long ride) {
        try { line(tenant, invoice, number, "RIDE", ride); return true; }
        catch (org.springframework.dao.DataIntegrityViolationException expected) { return false; }
    }

    private long invoice(String tenant) {
        String number = UUID.randomUUID().toString();
        db.update("INSERT INTO invoices (tenant_id,invoice_number,bill_to_type,bill_to_id,bill_to_name_snapshot,invoice_date,due_date,subtotal,tax_amount,discount_amount,total_amount,amount_paid,balance_due,currency,status,created_by,created_at,updated_by,updated_at) VALUES (?,?,'RIDER',1,'Test',CURRENT_DATE,CURRENT_DATE,10,0,0,10,0,10,'USD','DRAFT','test',NOW(),'test',NOW())", tenant, number);
        return db.queryForObject("SELECT id FROM invoices WHERE tenant_id=? AND invoice_number=?", Long.class, tenant, number);
    }

    private void line(String tenant, long invoice, int number, String source, Long reference) {
        db.update("INSERT INTO invoice_line_items (tenant_id,invoice_id,line_number,description,charge_source_type,source_reference_id,quantity,unit_price,line_amount,created_by,created_at,updated_by,updated_at) VALUES (?,?,?,'Test',?,?,1,10,10,'test',NOW(),'test',NOW())", tenant, invoice, number, source, reference);
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, java.util.concurrent.TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out while coordinating concurrent claim test.");
            }
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