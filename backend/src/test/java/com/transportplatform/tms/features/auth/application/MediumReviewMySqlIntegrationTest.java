package com.transportplatform.tms.features.auth.application;

import static org.assertj.core.api.Assertions.*;

import com.fasterxml.jackson.databind.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.billing.api.adjustment.BillingAdjustmentRecords.*;
import com.transportplatform.tms.features.billing.api.request.*;
import com.transportplatform.tms.features.billing.application.*;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.driverportal.application.DriverActionIdempotencyService;
import com.transportplatform.tms.features.location.api.request.DriverLocationSnapshotRequest;
import com.transportplatform.tms.features.location.application.DriverLocationSnapshotService;
import com.transportplatform.tms.features.privacy.application.PrivacyRetentionService;
import com.transportplatform.tms.features.settings.application.TenantTimeService;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
            "app.bootstrap.platform-admin.enabled=false",
            "app.dev-seed.enabled=true",
            "app.email.enabled=false",
            "app.push.enabled=false",
            "app.security.jwt.secret=isolated-medium-review-signing-key-12345678901234567890",
            "app.security.mfa-encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
            "app.auth.require-mfa-for-privileged-accounts=true",
            "app.security.auth-rate-limit.login-max-requests=100"
        })
@ActiveProfiles("dev")
@Testcontainers
class MediumReviewMySqlIntegrationTest {
    @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", MYSQL::getJdbcUrl);
        r.add("spring.datasource.username", MYSQL::getUsername);
        r.add("spring.datasource.password", MYSQL::getPassword);
    }

    private static final String TENANT = "demo-metro-mobility-000000000001";
    @Autowired JdbcTemplate db;
    @Autowired AppUserRepository users;
    @Autowired BillingAdjustmentService adjustments;
    @Autowired InvoiceService invoices;
    @Autowired PaymentService payments;
    @Autowired TenantTimeService time;
    @Autowired AuditLogService audit;
    @Autowired AuditIntegrityService integrity;
    @Autowired DriverActionIdempotencyService actions;
    @Autowired DriverLocationSnapshotService locations;
    @Autowired PrivacyRetentionService retention;
    @Autowired PlatformTransactionManager manager;
    @Autowired MfaService mfa;
    @Autowired TestRestTemplate http;
    @Autowired ObjectMapper mapper;
    @org.springframework.boot.test.web.server.LocalServerPort int port;

    @Autowired com.transportplatform.tms.common.privacy.PhiCipher privacyCipher;
    @Autowired ReceivablesService receivables;
    @Autowired com.transportplatform.tms.features.report.application.ReportService reports;

    @Autowired
    com.transportplatform.tms.features.compliance.application.ComplianceSyncWorker complianceWorker;

    @Autowired
    com.transportplatform.tms.features.compliance.application.ComplianceService compliance;

    @BeforeEach
    void principal() {
        actor("tenant.admin@demo.test");
    }

    @Autowired com.transportplatform.tms.features.saas.application.TenantEntitlementService subscriptionAccess;

    @Test void overdueBillingPreservesAssignedActiveTripsButNeverAllowsANewTripOrManualSuspensionBypass() {
        long subscription=db.queryForObject("SELECT id FROM tenant_subscriptions WHERE tenant_id=? ORDER BY effective_start_date DESC,id DESC LIMIT 1",Long.class,TENANT);
        String subscriptionStatus=db.queryForObject("SELECT status FROM tenant_subscriptions WHERE id=?",String.class,subscription);
        long driverId=db.queryForObject("SELECT driver_id FROM rides WHERE tenant_id=? AND driver_id IS NOT NULL ORDER BY id LIMIT 1",Long.class,TENANT);
        long ride=db.queryForObject("SELECT id FROM rides WHERE tenant_id=? AND driver_id=? ORDER BY id LIMIT 1",Long.class,TENANT,driverId);
        String oldRide=db.queryForObject("SELECT status FROM rides WHERE id=?",String.class,ride);
        long driverUser=db.queryForObject("SELECT app_user_id FROM portal_user_scopes WHERE tenant_id=? AND portal_subject_type='DRIVER' AND portal_subject_id=?",Long.class,TENANT,driverId);
        var principal=new AuthenticatedUser(driverUser,TENANT,"driver@example.test","Driver","User","",true,true,false,List.of(new SimpleGrantedAuthority("ROLE_DRIVER")));
        java.time.LocalDate today=java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        db.update("INSERT INTO platform_subscription_invoices(subscription_id,tenant_id,tenant_name,plan_code,period_start,period_end,due_date,metered_at,driver_count,driver_ids_json,monthly_driver_rate,amount,collection_mode) VALUES (?,?,'Test','TEST','2038-12-01','2039-01-01',?,UTC_TIMESTAMP(),1,'[1]',10,10,'MANUAL')",subscription,TENANT,today.minusDays(1));
        try {
            db.update("UPDATE rides SET status='PICKED_UP' WHERE id=?",ride);
            subscriptionAccess.requireRequestAccess(principal,"GET","/portal/driver/rides/"+ride);
            subscriptionAccess.requireRequestAccess(principal,"POST","/portal/driver/rides/"+ride+"/actions/dropped-off");
            subscriptionAccess.requireRequestAccess(principal,"POST","/portal/driver/rides/"+ride+"/location-snapshots");
            db.update("UPDATE rides SET status='ASSIGNED' WHERE id=?",ride);
            assertThatThrownBy(()->subscriptionAccess.requireRequestAccess(principal,"POST","/portal/driver/rides/"+ride+"/actions/driver-en-route")).isInstanceOf(ApiException.class);
            db.update("UPDATE rides SET status='PICKED_UP' WHERE id=?",ride);
            db.update("UPDATE tenant_subscriptions SET status='SUSPENDED' WHERE id=?",subscription);
            assertThatThrownBy(()->subscriptionAccess.requireRequestAccess(principal,"POST","/portal/driver/rides/"+ride+"/actions/complete")).isInstanceOf(ApiException.class);
        } finally {
            db.update("UPDATE rides SET status=? WHERE id=?",oldRide,ride);
            db.update("UPDATE tenant_subscriptions SET status=? WHERE id=?",subscriptionStatus,subscription);
            db.update("DELETE FROM platform_subscription_invoices WHERE subscription_id=? AND period_start='2038-12-01'",subscription);
        }
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void actor(String email) {
        var u = users.findForAuthenticationByEmail(email).orElseThrow();
        var p =
                new AuthenticatedUser(
                        u.getId(),
                        u.getTenantId(),
                        u.getEmail(),
                        u.getFirstName(),
                        u.getLastName(),
                        "",
                        true,
                        true,
                        false,
                        u.getRoles().stream()
                                .map(r -> new SimpleGrantedAuthority(r.name()))
                                .toList(),
                        u.getSecurityVersion());
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
    }

    private BigDecimal money(String v) {
        return new BigDecimal(v);
    }

    private long invoice(String amount, String currency) {
        var date = time.today(TENANT);
        var item =
                new InvoiceLineItemUpsertRequest(
                        "Test service",
                        ChargeSourceType.MANUAL,
                        null,
                        null,
                        BigDecimal.ONE,
                        money(amount),
                        date,
                        null,
                        null);
        var request =
                new ManualInvoiceGenerationRequest(
                        BillToType.RIDER,
                        1L,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        date,
                        date.plusDays(14),
                        currency,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        null,
                        null,
                        null,
                        List.of(item));
        var result = invoices.generateManualInvoice(request, UUID.randomUUID().toString());
        invoices.issueCompanyInvoice(result.id());
        return result.id();
    }

    @Test
    void repeatedManualReceiptCannotBeAppliedAgainWithANewRequestKey() {
        long id = invoice("100.00", "USD");
        var receipt = new PaymentUpsertRequest(id,time.today(TENANT),money("10.00"),PaymentMethod.BANK_TRANSFER,"bank receipt",null,null,"receipt-unique-123",null,true);
        var unreferenced = new PaymentUpsertRequest(id,time.today(TENANT),money("10.00"),PaymentMethod.BANK_TRANSFER,null,null,null,null,null,true);
        assertThatThrownBy(() -> payments.createCompanyPayment(unreferenced,UUID.randomUUID().toString())).isInstanceOf(ApiException.class);
        payments.createCompanyPayment(receipt,UUID.randomUUID().toString());
        assertThatThrownBy(() -> payments.createCompanyPayment(receipt,UUID.randomUUID().toString())).isInstanceOf(ApiException.class);
        assertThat(invoices.getCompanyInvoice(id).balanceDue()).isEqualByComparingTo("90.00");
    }

    @Autowired com.transportplatform.tms.features.report.application.ReportExportService exports;

    @Test
    void exportsMoreThanFiveThousandInvoicesOnTheSameDayWithoutSkippingRows() {
        String prefix="EXPORT-" + UUID.randomUUID().toString().substring(0,8) + "-";
        java.util.List<Object[]> rows=new java.util.ArrayList<>();
        for(int i=0;i<5002;i++) rows.add(new Object[]{TENANT,prefix+i,time.today(TENANT),time.today(TENANT)});
        db.batchUpdate("INSERT INTO invoices(tenant_id,invoice_number,bill_to_type,bill_to_id,bill_to_name_snapshot,invoice_date,due_date,subtotal,tax_amount,discount_amount,total_amount,amount_paid,balance_due,currency,status,created_by,created_at,updated_by,updated_at) VALUES(?,?,'RIDER',1,'Export test',?,?,1,0,0,1,0,1,'USD','ISSUED','test',UTC_TIMESTAMP(),'test',UTC_TIMESTAMP())",rows);
        try {
            var job=exports.create(new com.transportplatform.tms.features.report.application.ReportExportService.Request(
                com.transportplatform.tms.features.report.domain.ReportType.INVOICE,
                Map.of("keyword",prefix,"fromDate",time.today(TENANT).toString(),"toDate",time.today(TENANT).toString())));
            exports.runDue();
            assertThat(exports.status(job.id()).status()).isEqualTo("COMPLETED");
            String csv=exports.download(job.id());
            assertThat(csv.lines().count()).isEqualTo(5003);
            assertThat(csv.lines().skip(1).distinct().count()).isEqualTo(5002);
        } finally { db.update("DELETE FROM invoices WHERE tenant_id=? AND invoice_number LIKE ?",TENANT,prefix+"%"); }
    }

    private long cash(long invoice, String amount) {
        return payments.createCompanyPayment(
                        new PaymentUpsertRequest(
                                invoice,
                                time.today(TENANT),
                                money(amount),
                                PaymentMethod.CASH,
                                "test-cash",
                                null,
                                null,
                                null,
                                null,
                                true),
                        UUID.randomUUID().toString())
                .id();
    }

    @Test
    void refundsPreserveOriginalReceiptReopenBalanceAndDeduplicate() {
        long invoice = invoice("100.00", "USD"), payment = cash(invoice, "100.00");
        String key = UUID.randomUUID().toString(), reference = "REF-" + UUID.randomUUID();
        BigDecimal collectedBefore =
                receivables.getReceivablesSummary(TENANT).totalCollectedAmount();
        var request = new RefundRequest(money("20.00"), reference, "Returned payment");
        var first = adjustments.refund(payment, request, key);
        assertThat(adjustments.refund(payment, request, key).id()).isEqualTo(first.id());
        assertThat(receivables.getReceivablesSummary(TENANT).totalCollectedAmount())
                .isEqualByComparingTo(collectedBefore.subtract(money("20.00")));
        var report =
                reports.runPaymentReport("", null, null, time.today(TENANT), time.today(TENANT));
        var reportRow =
                report.rows().stream()
                        .filter(row -> row.id().equals(payment))
                        .findFirst()
                        .orElseThrow();
        assertThat(reportRow.refundedAmount()).isEqualByComparingTo("20.00");
        assertThat(reportRow.netCollectedAmount()).isEqualByComparingTo("80.00");
        var receipt = payments.getCompanyPayment(payment);
        assertThat(receipt.amount()).isEqualByComparingTo("100.00");
        assertThat(receipt.refundedAmount()).isEqualByComparingTo("20.00");
        assertThat(invoices.getCompanyInvoice(invoice).balanceDue()).isEqualByComparingTo("20.00");
        assertThat(
                        db.queryForObject(
                                "SELECT reason FROM payment_refunds WHERE id=?",
                                String.class,
                                first.id()))
                .startsWith("phi1.");
        assertThatThrownBy(
                        () ->
                                adjustments.refund(
                                        payment,
                                        new RefundRequest(
                                                money("81.00"), "over-" + reference, "Too much"),
                                        UUID.randomUUID().toString()))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(
                        () ->
                                adjustments.refund(
                                        payment,
                                        new RefundRequest(
                                                money("1.00"),
                                                reference,
                                                "Duplicate bank reference"),
                                        UUID.randomUUID().toString()))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(
                        () ->
                                payments.voidCompanyPayment(
                                        payment,
                                        new PaymentVoidRequest("Do not erase refunded receipt")))
                .isInstanceOf(ApiException.class);
        adjustments.refund(
                payment,
                new RefundRequest(money("80.00"), "last-" + reference, "Remaining cash returned"),
                UUID.randomUUID().toString());
        assertThat(payments.getCompanyPayment(payment).status()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(invoices.getCompanyInvoice(invoice).amountPaid()).isEqualByComparingTo("0.00");
    }

    @Test
    void creditsCannotBeOverspentOrCountedAsCashAndCurrencyIsUsdOnly() {
        long source = invoice("100.00", "USD"),
                target = invoice("50.00", "USD");
        assertThatThrownBy(() -> invoice("50.00", "EUR")).isInstanceOf(ApiException.class);
        var note =
                adjustments.createCredit(
                        source,
                        new CreditRequest(money("30.00"), "Future service goodwill"),
                        UUID.randomUUID().toString());
        String key = UUID.randomUUID().toString();
        var application =
                adjustments.applyCredit(
                        note.id(), new ApplyCreditRequest(target, money("20.00")), key);
        assertThat(
                        adjustments
                                .applyCredit(
                                        note.id(),
                                        new ApplyCreditRequest(target, money("20.00")),
                                        key)
                                .id())
                .isEqualTo(application.id());
        assertThat(invoices.getCompanyInvoice(target).balanceDue()).isEqualByComparingTo("30.00");
        assertThat(adjustments.credits(source, false).getFirst().availableAmount())
                .isEqualByComparingTo("10.00");
        assertThat(payments.getCompanyPayment(application.paymentId()).paymentMethod())
                .isEqualTo(PaymentMethod.CREDIT_NOTE);
        assertThatThrownBy(
                        () ->
                                adjustments.applyCredit(
                                        note.id(),
                                        new ApplyCreditRequest(target, money("11.00")),
                                        UUID.randomUUID().toString()))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(
                        () ->
                                adjustments.voidCredit(
                                        note.id(),
                                        new VoidCreditRequest("Already used"),
                                        UUID.randomUUID().toString()))
                .isInstanceOf(ApiException.class);
        payments.voidCompanyPayment(
                application.paymentId(), new PaymentVoidRequest("Restore unused voucher"));
        assertThat(adjustments.credits(source, false).getFirst().availableAmount())
                .isEqualByComparingTo("30.00");
        adjustments.voidCredit(
                note.id(),
                new VoidCreditRequest("Unused voucher withdrawn"),
                UUID.randomUUID().toString());
        assertThat(adjustments.credits(source, false).getFirst().status()).isEqualTo("VOID");
    }

    @Test
    void concurrentCreditApplicationsCannotConsumeTheSameBalanceTwice() throws Exception {
        long source = invoice("100.00", "USD"), target = invoice("100.00", "USD");
        var note =
                adjustments.createCredit(
                        source,
                        new CreditRequest(money("30.00"), "Future credit"),
                        UUID.randomUUID().toString());
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> apply =
                    () -> {
                        assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                        actor("tenant.admin@demo.test");
                        try {
                            adjustments.applyCredit(
                                    note.id(),
                                    new ApplyCreditRequest(target, money("20.00")),
                                    UUID.randomUUID().toString());
                            return true;
                        } catch (ApiException e) {
                            return false;
                        } finally {
                            clear();
                        }
                    };
            var a = pool.submit(apply);
            var b = pool.submit(apply);
            start.countDown();
            assertThat(List.of(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
        } finally {
            start.countDown();
        }
        assertThat(invoices.getCompanyInvoice(target).amountPaid()).isEqualByComparingTo("20.00");
    }

    @Test
    void signedAuditDetectsChangesAndDeletionButAllowsAuthenticatedRetention() {
        audit.record(
                new AuditLogCommand(
                        null,
                        TENANT,
                        "TEST",
                        "UPDATED",
                        "TEST",
                        "1",
                        "Test update",
                        null,
                        Map.of("status", "ACTIVE")));
        long id =
                db.queryForObject(
                        "SELECT MAX(id) FROM audit_logs WHERE tenant_id=?", Long.class, TENANT);
        String summary =
                db.queryForObject("SELECT summary FROM audit_logs WHERE id=?", String.class, id);
        var head = integrity.verify(TENANT, 0, null, null);
        assertThat(head.issues()).isEmpty();
        db.update("UPDATE audit_logs SET summary='tampered' WHERE id=?", id);
        assertThat(integrity.verify(TENANT, 0, head.headSequence(), head.headSignature()).issues())
                .contains("MODIFIED_AUDIT_RECORD_" + id);
        db.update("UPDATE audit_logs SET summary=? WHERE id=?", summary, id);
        try (var connection = db.getDataSource().getConnection()) {
            connection.setAutoCommit(false);
            com.transportplatform.tms.common.privacy.PrivacyMaintenanceCommand.run(
                    connection, privacyCipher, true);
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException(e);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        assertThat(integrity.verify(TENANT, 0, head.headSequence(), head.headSignature()).issues())
                .isEmpty();

        new TransactionTemplate(manager)
                .executeWithoutResult(s -> integrity.retire(TENANT, List.of(id)));
        assertThat(integrity.verify(TENANT, 0, head.headSequence(), head.headSignature()).issues())
                .isEmpty();
    }

    @Test
    void driverActionStoresOriginalResultAndSerializesConcurrentRetries() throws Exception {
        actor("driver@demo.test");
        String key = UUID.randomUUID().toString();
        var calls = new AtomicInteger();
        assertThat(
                        actions.execute(
                                key,
                                1L,
                                "arrived",
                                String.class,
                                () -> "original",
                                () -> "current"))
                .isEqualTo("original");
        assertThat(
                        actions.execute(
                                key,
                                1L,
                                "arrived",
                                String.class,
                                () -> {
                                    calls.incrementAndGet();
                                    return "wrong";
                                },
                                () -> "later-state"))
                .isEqualTo("original");
        assertThat(calls.get()).isZero();
        assertThatThrownBy(
                        () ->
                                actions.execute(
                                        null,
                                        1L,
                                        "arrived",
                                        String.class,
                                        () -> "bad",
                                        () -> "bad"))
                .isInstanceOf(ApiException.class);
        String concurrent = UUID.randomUUID().toString();
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<String> run =
                    () -> {
                        assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                        actor("driver@demo.test");
                        try {
                            return actions.execute(
                                    concurrent,
                                    1L,
                                    "arrived",
                                    String.class,
                                    () -> {
                                        calls.incrementAndGet();
                                        return "once";
                                    },
                                    () -> "current");
                        } finally {
                            clear();
                        }
                    };
            var a = pool.submit(run);
            var b = pool.submit(run);
            start.countDown();
            assertThat(a.get(15, TimeUnit.SECONDS)).isEqualTo("once");
            assertThat(b.get(15, TimeUnit.SECONDS)).isEqualTo("once");
        } finally {
            start.countDown();
        }
        assertThat(calls.get()).isEqualTo(1);
    }

    @Test
    void gpsRejectsOldAndRapidSamplesAndStopsShowingCompletedTrips() {
        db.update("UPDATE rides SET status='DRIVER_EN_ROUTE',driver_id=1,vehicle_id=1 WHERE id=1");
        actor("driver@demo.test");
        var sample = new DriverLocationSnapshotRequest(33.75, -84.39, 5.0, 0.0, 0.0, Instant.now());
        locations.captureDriverRideSnapshot(1L, sample);
        assertThatThrownBy(() -> locations.captureDriverRideSnapshot(1L, sample))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(
                        () ->
                                locations.captureDriverRideSnapshot(
                                        1L,
                                        new DriverLocationSnapshotRequest(
                                                33.75,
                                                -84.39,
                                                5.0,
                                                0.0,
                                                0.0,
                                                Instant.now().minusSeconds(301))))
                .isInstanceOf(ApiException.class);
        db.update("UPDATE rides SET status='COMPLETED' WHERE id=1");
        assertThat(locations.getLatestDriverRideSnapshot(1L)).isNull();
        actor("tenant.admin@demo.test");
        assertThat(locations.getLatestCompanyRideSnapshot(1L)).isNull();
    }

    @Test
    void passwordOnlyPrivilegedLoginIsRestrictedButCanEnrollWithoutLockout() {
        db.update(
                "UPDATE app_users SET"
                        + " mfa_secret=NULL,mfa_recovery_hashes=NULL,mfa_pending_secret=NULL WHERE"
                        + " email='tenant.admin@demo.test'");
        var login =
                call(
                        HttpMethod.POST,
                        "/v1/auth/login",
                        Map.of("email", "tenant.admin@demo.test", "password", "Password123"),
                        null);
        assertThat(login.getStatusCode().value()).isEqualTo(200);
        String token = login.getBody().path("data").path("accessToken").asText();
        assertThat(
                        login.getBody()
                                .path("data")
                                .path("user")
                                .path("mfaEnrollmentRequired")
                                .asBoolean())
                .isTrue();
        assertThat(call(HttpMethod.GET, "/company/drivers", null, token).getStatusCode().value())
                .isEqualTo(403);
        assertThat(
                        call(
                                        HttpMethod.POST,
                                        "/v1/auth/mfa/setup",
                                        Map.of("password", "Password123"),
                                        token)
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
        var user = users.findForAuthenticationByEmail("tenant.admin@demo.test").orElseThrow();
        byte[] secret =
                ReflectionTestUtils.invokeMethod(
                        mfa, "decrypt", user.getMfaPendingSecret(), user.getId());
        String code = MfaService.totp(secret, Instant.now().getEpochSecond() / 30);
        assertThat(
                        call(
                                        HttpMethod.POST,
                                        "/v1/auth/mfa/activate",
                                        Map.of("password", "Password123", "code", code),
                                        token)
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
        var signed =
                call(
                        HttpMethod.POST,
                        "/v1/auth/login",
                        Map.of(
                                "email",
                                "tenant.admin@demo.test",
                                "password",
                                "Password123",
                                "mfaCode",
                                MfaService.totp(secret, Instant.now().getEpochSecond() / 30 + 1)),
                        null);
        assertThat(signed.getStatusCode().value()).isEqualTo(200);
        assertThat(
                        signed.getBody()
                                .path("data")
                                .path("user")
                                .path("mfaEnrollmentRequired")
                                .asBoolean())
                .isFalse();
        assertThat(
                        call(
                                        HttpMethod.GET,
                                        "/company/drivers",
                                        null,
                                        signed.getBody().path("data").path("accessToken").asText())
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
    }

    @Autowired InvoiceAgingWorker aging;
    @Autowired BillingAccessService billingAccess;
    @Autowired InvoiceRepository invoiceRepository;

    @Test
    void agingPersistsOverdueAndListFiltersDoNotOverlap() {
        long id = invoice("40.00", "USD");
        db.update(
                "UPDATE invoices SET due_date=?,status='ISSUED' WHERE id=?",
                time.today(TENANT).minusDays(1),
                id);
        var today = time.today(TENANT);
        assertThat(
                        invoiceRepository
                                .findAll(
                                        InvoiceSpecifications.search(
                                                TENANT,
                                                null,
                                                InvoiceStatus.OVERDUE,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                today))
                                .stream()
                                .map(Invoice::getId))
                .contains(id);
        assertThat(
                        invoiceRepository
                                .findAll(
                                        InvoiceSpecifications.search(
                                                TENANT,
                                                null,
                                                InvoiceStatus.ISSUED,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                today))
                                .stream()
                                .map(Invoice::getId))
                .doesNotContain(id);
        aging.reconcile(TENANT);
        assertThat(db.queryForObject("SELECT status FROM invoices WHERE id=?", String.class, id))
                .isEqualTo("OVERDUE");
        cash(id, "10.00");
        assertThat(db.queryForObject("SELECT status FROM invoices WHERE id=?", String.class, id))
                .isEqualTo("OVERDUE");
    }

    @Test
    void invoiceHelperRejectsArbitraryTenantAndPlatformScope() {
        assertThatThrownBy(() -> billingAccess.findAllInvoicesForTenant("another-tenant"))
                .isInstanceOf(ApiException.class);
        assertThat(billingAccess.findAllInvoicesForTenant(TENANT)).isNotNull();
        actor("platform.admin@demo.test");
        assertThatThrownBy(() -> billingAccess.findAllInvoicesForTenant(TENANT))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void gpsRetentionHonorsLegalHoldAndKeepsMilestoneEvidence() {
        String insert =
                "INSERT INTO"
                    + " driver_location_snapshots(tenant_id,ride_id,driver_id,vehicle_id,latitude,longitude,captured_at,created_by,created_at,updated_by,updated_at)"
                    + " VALUES(?,1,1,1,'33.75','-84.39',UTC_TIMESTAMP(6),'test',DATE_SUB(UTC_TIMESTAMP(6),INTERVAL"
                    + " 40 DAY),'test',UTC_TIMESTAMP(6))";
        db.update(insert, TENANT);
        long pinned =
                db.queryForObject("SELECT MAX(id) FROM driver_location_snapshots", Long.class);
        db.update(insert, TENANT);
        long raw = db.queryForObject("SELECT MAX(id) FROM driver_location_snapshots", Long.class);
        db.update(
                "INSERT INTO"
                    + " trip_milestone_evidence(ride_id,tenant_id,driver_id,vehicle_id,address_hash,milestone,snapshot_id,distance_meters,accuracy_meters,recorded_by,recorded_at)"
                    + " VALUES(1,?,1,1,?,'ARRIVED',?,0,5,?,UTC_TIMESTAMP(6))",
                TENANT,
                "a".repeat(64),
                pinned,
                users.findForAuthenticationByEmail("tenant.admin@demo.test").orElseThrow().getId());
        db.update(
                "INSERT INTO"
                    + " privacy_retention_policies(scope_key,legal_hold,location_days,updated_by,updated_at)"
                    + " VALUES(?,TRUE,30,1,UTC_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE"
                    + " legal_hold=TRUE,location_days=30",
                TENANT);
        try {
            assertThat(retention.cleanLocations(TENANT)).isZero();
            db.update(
                    "UPDATE privacy_retention_policies SET legal_hold=FALSE WHERE scope_key=?",
                    TENANT);
            assertThat(retention.cleanLocations(TENANT)).isGreaterThanOrEqualTo(1);
            assertThat(
                            db.queryForObject(
                                    "SELECT COUNT(*) FROM driver_location_snapshots WHERE id=?",
                                    Integer.class,
                                    raw))
                    .isZero();
            assertThat(
                            db.queryForObject(
                                    "SELECT COUNT(*) FROM driver_location_snapshots WHERE id=?",
                                    Integer.class,
                                    pinned))
                    .isEqualTo(1);
        } finally {
            db.update(
                    "UPDATE privacy_retention_policies SET legal_hold=FALSE WHERE scope_key=?",
                    TENANT);
        }
    }

    @Test
    void temporaryPasswordLoginCannotRefreshAndMissingExpiryFailsClosed() {
        db.update(
                "UPDATE app_users SET"
                    + " must_change_password=TRUE,temporary_password_expires_at=DATE_ADD(UTC_TIMESTAMP(6),INTERVAL"
                    + " 24 HOUR) WHERE email='billing@demo.test'");
        try {
            var login =
                    call(
                            HttpMethod.POST,
                            "/v1/auth/login",
                            Map.of("email", "billing@demo.test", "password", "Password123"),
                            null);
            assertThat(login.getStatusCode().value()).isEqualTo(200);
            assertThat(
                            call(
                                            HttpMethod.POST,
                                            "/v1/auth/refresh",
                                            Map.of(
                                                    "refreshToken",
                                                    login.getBody()
                                                            .path("data")
                                                            .path("refreshToken")
                                                            .asText()),
                                            null)
                                    .getStatusCode()
                                    .value())
                    .isEqualTo(401);
            db.update(
                    "UPDATE app_users SET temporary_password_expires_at=NULL WHERE"
                            + " email='billing@demo.test'");
            assertThat(
                            call(
                                            HttpMethod.POST,
                                            "/v1/auth/login",
                                            Map.of(
                                                    "email",
                                                    "billing@demo.test",
                                                    "password",
                                                    "Password123"),
                                            null)
                                    .getStatusCode()
                                    .value())
                    .isEqualTo(401);
        } finally {
            db.update(
                    "UPDATE app_users SET"
                            + " must_change_password=FALSE,temporary_password_expires_at=NULL WHERE"
                            + " email='billing@demo.test'");
        }
    }

    @Test
    void publishesFinancialAndMfaContracts() throws Exception {
        var response = call(HttpMethod.GET, "/v3/api-docs", null, null);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        var schemas = response.getBody().path("components").path("schemas");
        assertThat(schemas.path("RefundRequest").path("properties").has("amount")).isTrue();
        assertThat(
                        schemas.path("AuthenticatedUserResponse")
                                .path("properties")
                                .has("mfaEnrollmentRequired"))
                .isTrue();
        String output = System.getProperty("contracts.output");
        if (output != null)
            java.nio.file.Files.writeString(
                    java.nio.file.Path.of(output), response.getBody().toString());
    }

    @Test
    void scheduledComplianceRefreshSurfacesTrainingFailuresAndForbidsCriticalDismissal() {
        String old =
                db.queryForObject("SELECT training_status FROM drivers WHERE id=1", String.class);
        try {
            db.update("UPDATE drivers SET training_status='NOT_STARTED' WHERE id=1");
            complianceWorker.run();
            long id =
                    db.queryForObject(
                            "SELECT id FROM compliance_issues WHERE tenant_id=? AND"
                                + " entity_type='DRIVER' AND entity_id=1 AND"
                                + " related_document_type='TRAINING_INCOMPLETE' ORDER BY id DESC"
                                + " LIMIT 1",
                            Long.class,
                            TENANT);
            assertThat(
                            db.queryForObject(
                                    "SELECT issue_status FROM compliance_issues WHERE id=?",
                                    String.class,
                                    id))
                    .isEqualTo("OPEN");
            assertThatThrownBy(() -> compliance.dismissCompanyIssue(id))
                    .isInstanceOf(ApiException.class);
        } finally {
            db.update("UPDATE drivers SET training_status=? WHERE id=1", old);
            complianceWorker.run();
        }
    }

    @Test
    void platformAdminEnrollmentAndRefreshBoundariesProtectSubscriptionPlans() {
        var login =
                call(
                        HttpMethod.POST,
                        "/v1/auth/login",
                        Map.of("email", "platform.admin@demo.test", "password", "Password123"),
                        null);
        assertThat(login.getStatusCode().value()).isEqualTo(200);
        String token = login.getBody().path("data").path("accessToken").asText();
        assertThat(
                        login.getBody()
                                .path("data")
                                .path("user")
                                .path("mfaEnrollmentRequired")
                                .asBoolean())
                .isTrue();
        var forbidden = call(HttpMethod.GET, "/platform/subscription-plans", null, token);
        assertThat(forbidden.getStatusCode().value()).isEqualTo(403);
        assertThat(forbidden.getBody().path("error").path("details").path("authAction").asText())
                .isEqualTo("ENROLL_MFA");
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("X-Tenant-Id", "stale-tenant");
        headers.set("Cookie", login.getHeaders().getFirst("Set-Cookie").split(";", 2)[0]);
        var refresh =
                http.exchange(
                        "http://localhost:" + port + "/api/v1/auth/refresh",
                        HttpMethod.POST,
                        new HttpEntity<>(null, headers),
                        JsonNode.class);
        // Refresh authenticates its own credential; the facade still refuses unenrolled MFA
        // sessions.
        assertThat(refresh.getStatusCode().value()).isEqualTo(401);
        // Rejected refresh revokes old sessions; authenticate again before enrollment.
        login =
                call(
                        HttpMethod.POST,
                        "/v1/auth/login",
                        Map.of("email", "platform.admin@demo.test", "password", "Password123"),
                        null);
        assertThat(login.getStatusCode().value()).isEqualTo(200);
        token = login.getBody().path("data").path("accessToken").asText();
        assertThat(
                        call(
                                        HttpMethod.POST,
                                        "/v1/auth/mfa/setup",
                                        Map.of("password", "Password123"),
                                        token)
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
        var user = users.findForAuthenticationByEmail("platform.admin@demo.test").orElseThrow();
        byte[] secret =
                ReflectionTestUtils.invokeMethod(
                        mfa, "decrypt", user.getMfaPendingSecret(), user.getId());
        String code = MfaService.totp(secret, Instant.now().getEpochSecond() / 30);
        assertThat(
                        call(
                                        HttpMethod.POST,
                                        "/v1/auth/mfa/activate",
                                        Map.of("password", "Password123", "code", code),
                                        token)
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
        var signed =
                call(
                        HttpMethod.POST,
                        "/v1/auth/login",
                        Map.of(
                                "email",
                                "platform.admin@demo.test",
                                "password",
                                "Password123",
                                "mfaCode",
                                MfaService.totp(secret, Instant.now().getEpochSecond() / 30 + 1)),
                        null);
        assertThat(signed.getStatusCode().value()).isEqualTo(200);
        assertThat(
                        call(
                                        HttpMethod.GET,
                                        "/platform/subscription-plans",
                                        null,
                                        signed.getBody().path("data").path("accessToken").asText())
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
        headers.set("Cookie", signed.getHeaders().getFirst("Set-Cookie").split(";", 2)[0]);
        headers.set("Origin", "https://untrusted.example");
        assertThat(
                        http.exchange(
                                        "http://localhost:" + port + "/api/v1/auth/refresh",
                                        HttpMethod.POST,
                                        new HttpEntity<>(null, headers),
                                        String.class)
                                .getStatusCode()
                                .value())
                .isEqualTo(403);
        headers.remove("Origin");
        var renewed =
                http.exchange(
                        "http://localhost:" + port + "/api/v1/auth/refresh",
                        HttpMethod.POST,
                        new HttpEntity<>(null, headers),
                        JsonNode.class);
        assertThat(renewed.getStatusCode().value()).isEqualTo(200);
        assertThat(
                        renewed.getBody()
                                .path("data")
                                .path("user")
                                .path("mfaEnrollmentRequired")
                                .asBoolean())
                .isFalse();
        assertThat(
                        call(
                                        HttpMethod.GET,
                                        "/platform/subscription-plans",
                                        null,
                                        renewed.getBody().path("data").path("accessToken").asText())
                                .getStatusCode()
                                .value())
                .isEqualTo(200);
    }

    private ResponseEntity<JsonNode> call(
            HttpMethod method, String path, Object body, String token) {
        var h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("X-Client-Platform", "web");
        if (token != null) h.setBearerAuth(token);
        return http.exchange(
                "http://localhost:" + port + "/api" + path,
                method,
                new HttpEntity<>(body, h),
                JsonNode.class);
    }
}
