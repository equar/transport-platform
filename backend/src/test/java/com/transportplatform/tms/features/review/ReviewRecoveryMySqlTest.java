package com.transportplatform.tms.features.review;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.concurrency.WorkflowLockService;
import com.transportplatform.tms.features.auth.application.RecoveryEmailService;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.billing.application.ReceivablesQueries;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.notification.application.*;
import com.transportplatform.tms.features.notification.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.*;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@DataJpaTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate","spring.flyway.locations=classpath:db/migration"})
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
@Import({JpaAuditConfig.class,WorkflowLockService.class,ReceivablesQueries.class,RecoveryEmailService.class,NotificationEmailRetryService.class,ReviewRecoveryMySqlTest.Config.class})
@Testcontainers
@Transactional(propagation=Propagation.NOT_SUPPORTED)
class ReviewRecoveryMySqlTest {
    @Container static MySQLContainer<?> mysql=new MySQLContainer<>("mysql:8.0.45");
    @DynamicPropertySource static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",mysql::getJdbcUrl);r.add("spring.datasource.username",mysql::getUsername);r.add("spring.datasource.password",mysql::getPassword);
    }
    @TestConfiguration static class Config {
        @Bean Clock clock(){return Clock.fixed(Instant.parse("2030-01-15T12:00:00Z"),ZoneOffset.UTC);}
        @Bean ObjectMapper mapper(){return new ObjectMapper().findAndRegisterModules();}
    }
    @Autowired TenantRepository tenants;
    @Autowired AppUserRepository users;
    @Autowired NotificationRepository notifications;
    @Autowired JdbcTemplate db;
    @Autowired WorkflowLockService locks;
    @Autowired ReceivablesQueries queries;
    @Autowired RecoveryEmailService recovery;
    @Autowired NotificationEmailRetryService emails;
    @Autowired PlatformTransactionManager manager;
    @Autowired Clock clock;
    @MockitoBean NotificationEmailSender sender;
    @MockitoBean NotificationDeliveryAccess deliveryAccess;
    String tenant;
    AppUser user;
    @BeforeEach void setup() {
        tenant=UUID.randomUUID().toString();
        var t=new Tenant();t.setId(tenant);t.setTenantCode(tenant);t.setCompanyName("Review fixture");t.setLegalName(tenant);t.setEmail(tenant+"@example.test");t.setPhone("5550101234");t.setAddressLine1("1 Main St");t.setCity("Boston");t.setState("MA");t.setZipCode("02110");t.setCountry("US");t.setBusinessType("TRANSPORT");t.setSubscriptionPlan("TEST");t.setStatus(TenantStatus.ACTIVE);tenants.saveAndFlush(t);
        user=new AppUser();user.setTenantId(tenant);user.setEmail(tenant+"@example.test");user.setPasswordHash("test");user.setStatus(UserStatus.ACTIVE);user.setPasswordResetTokenHash("reset-token-hash");user.setPasswordResetTokenExpiresAt(clock.instant().plusSeconds(3600));user=users.saveAndFlush(user);
        reset(sender,deliveryAccess);
    }
    @Test void summariesUseNetCashAndExactAgingBoundaries() {
        long invoice=invoice("ISSUED",0);
        invoice("ISSUED",30);invoice("PARTIALLY_PAID",31);invoice("ISSUED",91);invoice("DRAFT",100);invoice("VOID",100);
        payment(invoice,"CASH","APPLIED",20,5);payment(invoice,"CREDIT_NOTE","APPLIED",100,0);payment(invoice,"CASH","FAILED",20,0);
        var summary=queries.summary(tenant,LocalDate.now(clock));
        assertThat(summary.totalCollectedAmount()).isEqualByComparingTo("15.00");
        assertThat(summary.outstandingBalance()).isEqualByComparingTo("40.00");
        assertThat(summary.overdueAmount()).isEqualByComparingTo("30.00");
        assertThat(summary.overdueInvoiceCount()).isEqualTo(3);
        assertThat(summary.totalPaymentsRecorded()).isEqualTo(3);
        assertThat(summary.agingBuckets()).filteredOn(bucket->bucket.bucket()==InvoiceAgingBucket.DAYS_31_TO_60).singleElement().satisfies(bucket->assertThat(bucket.invoiceCount()).isEqualTo(1));
    }
    private long invoice(String status,int daysLate) {
        String number=UUID.randomUUID().toString();
        db.update("INSERT INTO invoices(tenant_id,invoice_number,bill_to_type,bill_to_id,bill_to_name_snapshot,invoice_date,due_date,subtotal,tax_amount,discount_amount,total_amount,amount_paid,balance_due,currency,status,created_by,created_at,updated_by,updated_at) VALUES(?,?,'RIDER',1,'Synthetic',?,?,10,0,0,10,0,10,'USD',?,'test',NOW(),'test',NOW())",tenant,number,LocalDate.now(clock),LocalDate.now(clock).minusDays(daysLate),status);
        return db.queryForObject("SELECT id FROM invoices WHERE tenant_id=? AND invoice_number=?",Long.class,tenant,number);
    }
    private void payment(long invoice,String method,String status,int amount,int refunded) {
        Long credit=null;
        if (method.equals("CREDIT_NOTE")) {
            String number=UUID.randomUUID().toString();
            db.update("INSERT INTO credit_notes(tenant_id,source_invoice_id,credit_number,bill_to_type,bill_to_id,amount,currency,status,reason,created_by) VALUES(?,?,?,'RIDER',1,?,'USD','ISSUED','Synthetic',?)",tenant,invoice,number,amount,user.getId());
            credit=db.queryForObject("SELECT id FROM credit_notes WHERE tenant_id=? AND credit_number=?",Long.class,tenant,number);
        }
        db.update("INSERT INTO payments(tenant_id,invoice_id,payment_number,payment_date,amount,payment_method,status,refunded_amount,source_credit_note_id,created_by,created_at,updated_by,updated_at) VALUES(?,?,?, ?,?,?,?,?,?,'test',NOW(),'test',NOW())",tenant,invoice,UUID.randomUUID().toString(),LocalDate.now(clock),amount,method,status,refunded,credit);
    }
    @Test void financeLockDoesNotHoldTheDispatchTenantRow() throws Exception {
        var tx=new TransactionTemplate(manager);
        tx.executeWithoutResult(status->locks.lock(tenant,"FINANCE",0));
        var acquired=new CountDownLatch(1);var release=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var finance=pool.submit(()->tx.executeWithoutResult(status->{locks.lock(tenant,"FINANCE",0);acquired.countDown();try{assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();}catch(InterruptedException e){throw new RuntimeException(e);}}));
            assertThat(acquired.await(5,TimeUnit.SECONDS)).isTrue();
            try {pool.submit(()->tx.executeWithoutResult(status->tenants.lockForDispatch(tenant).orElseThrow())).get(2,TimeUnit.SECONDS);}
            finally {release.countDown();}
            finance.get(5,TimeUnit.SECONDS);
        }
    }
    @Test void recoveryEmailIsEncryptedTransactionalAndRecoversExpiredClaims() {
        var tx=new TransactionTemplate(manager);
        tx.executeWithoutResult(status->{recovery.enqueue(user,"https://example.test/#token=private-reset");status.setRollbackOnly();});
        assertThat(db.queryForObject("SELECT COUNT(*) FROM recovery_email_jobs WHERE user_id=?",Long.class,user.getId())).isZero();
        tx.executeWithoutResult(status->recovery.enqueue(user,"https://example.test/#token=private-reset"));
        assertThat(db.queryForObject("SELECT payload FROM recovery_email_jobs WHERE user_id=?",String.class,user.getId())).doesNotContain("private-reset").startsWith("phi1.");
        when(sender.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(false,"offline"));recovery.deliverDue();
        assertThat(db.queryForObject("SELECT attempts FROM recovery_email_jobs WHERE user_id=?",Integer.class,user.getId())).isEqualTo(1);
        db.update("UPDATE recovery_email_jobs SET status='SENDING',claim_token='old',next_attempt_at=? WHERE user_id=?",java.sql.Timestamp.from(clock.instant().minusSeconds(1)),user.getId());
        when(sender.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(true,null));recovery.deliverDue();
        assertThat(db.queryForObject("SELECT COUNT(*) FROM recovery_email_jobs WHERE user_id=?",Long.class,user.getId())).isZero();
    }
    @Test void aCrashOnTheLastEmailAttemptBecomesAVisibleTerminalFailure() {
        var n=new Notification();n.setTenantId(tenant);n.setNotificationCode(UUID.randomUUID().toString());n.setRecipientUserId(user.getId());n.setTitle("Synthetic update");n.setMessage("Open your account");n.setNotificationType(NotificationType.RIDE_STATUS_CHANGED);n.setChannel(NotificationChannel.EMAIL);n.setStatus(NotificationStatus.ACTIVE);n.setReadStatus(NotificationReadStatus.UNREAD);n.setDeliveryStatus(NotificationDeliveryStatus.PENDING);n.setNextDeliveryAttemptAt(clock.instant().minusSeconds(1));n.setDeliveryAttemptCount(3);n=notifications.saveAndFlush(n);
        db.update("UPDATE notifications SET delivery_claim='interrupted',delivery_lease_until=? WHERE id=?",java.time.LocalDateTime.ofInstant(clock.instant().minusSeconds(1),java.time.ZoneOffset.UTC),n.getId());
        emails.retryDueEmailNotifications();
        var result=notifications.findById(n.getId()).orElseThrow();
        assertThat(result.getDeliveryStatus()).isEqualTo(NotificationDeliveryStatus.FAILED);
        assertThat(result.getNextDeliveryAttemptAt()).isNull();
        verifyNoInteractions(sender);
    }

    @Test void twoEmailWorkersClaimOnceAndCallProviderOutsideTransactions() throws Exception {
        var n=new Notification();n.setTenantId(tenant);n.setNotificationCode(UUID.randomUUID().toString());n.setRecipientUserId(user.getId());n.setTitle("Synthetic update");n.setMessage("Open your account");n.setNotificationType(NotificationType.RIDE_STATUS_CHANGED);n.setChannel(NotificationChannel.EMAIL);n.setStatus(NotificationStatus.ACTIVE);n.setReadStatus(NotificationReadStatus.UNREAD);n.setDeliveryStatus(NotificationDeliveryStatus.PENDING);n.setNextDeliveryAttemptAt(clock.instant());n=notifications.saveAndFlush(n);
        when(deliveryAccess.recipient(any())).thenReturn(Optional.of(user));
        var sending=new CountDownLatch(1);var release=new CountDownLatch(1);
        when(sender.send(any())).thenAnswer(call->{assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();sending.countDown();assertThat(release.await(5,TimeUnit.SECONDS)).isTrue();return new NotificationEmailSender.DeliveryResult(true,null);});
        try(var pool=Executors.newFixedThreadPool(2)) {
            var first=pool.submit(emails::retryDueEmailNotifications);assertThat(sending.await(5,TimeUnit.SECONDS)).isTrue();
            try {pool.submit(emails::retryDueEmailNotifications).get(2,TimeUnit.SECONDS);} finally {release.countDown();}
            first.get(5,TimeUnit.SECONDS);
        }
        verify(sender,times(1)).send(any());
        assertThat(notifications.findById(n.getId()).orElseThrow().getDeliveryStatus()).isEqualTo(NotificationDeliveryStatus.SENT);
    }
}
