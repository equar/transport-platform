package com.transportplatform.tms.features.saas.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.saas.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@DataJpaTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
@Import({JpaAuditConfig.class,TenantEntitlementService.class,SubscriptionLifecycleService.class,TenantSubscriptionService.class,TenantSubscriptionMapper.class,TenantEntitlementMySqlTest.Config.class})
@Testcontainers
@Transactional(propagation=Propagation.NOT_SUPPORTED)
class TenantEntitlementMySqlTest {
    @Container static final MySQLContainer<?> MYSQL=new MySQLContainer<>("mysql:8.0.45");
    @DynamicPropertySource static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",MYSQL::getJdbcUrl);r.add("spring.datasource.username",MYSQL::getUsername);r.add("spring.datasource.password",MYSQL::getPassword);
    }
    static class MutableClock extends Clock {
        Instant value=Instant.parse("2030-01-15T12:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;} public Clock withZone(ZoneId zone){return this;} public Instant instant(){return value;}
    }
    @TestConfiguration static class Config { @Bean MutableClock clock(){return new MutableClock();} }
    @Autowired MutableClock clock;
    @Autowired JdbcTemplate db;
    @Autowired TenantEntitlementService access;
    @Autowired SubscriptionLifecycleService lifecycle;
    @Autowired TenantSubscriptionService subscriptions;
    @Autowired TenantRepository tenants;
    @Autowired AppUserRepository users;
    @Autowired PlatformTransactionManager manager;
    @MockBean com.transportplatform.tms.features.auth.application.AuthSessionService sessions;
    @MockBean com.transportplatform.tms.features.audit.application.AuditLogService audit;
    String tenant; long plan,subscription;
    @BeforeEach void setup() {
        clock.value=Instant.parse("2030-01-15T12:00:00Z");
        tenant=UUID.randomUUID().toString();
        Tenant t=new Tenant();t.setId(tenant);t.setTenantCode(tenant);t.setCompanyName("Capacity test");t.setLegalName("Capacity test "+tenant);
        t.setEmail(tenant+"@example.test");t.setPhone("5550101234");t.setAddressLine1("1 Main St");t.setCity("Boston");t.setState("MA");t.setZipCode("02110");t.setCountry("US");t.setBusinessType("TRANSPORT");t.setSubscriptionPlan("TEST");t.setStatus(TenantStatus.ACTIVE);tenants.saveAndFlush(t);
        db.update("INSERT INTO subscription_plans(plan_code,name,tier,monthly_price,annual_price,currency,max_users,max_drivers,max_vehicles,max_riders,max_organizations,status,created_by,created_at,updated_by,updated_at) VALUES (?, 'Capacity','CUSTOM',0,0,'USD',1,1,1,1,1,'ACTIVE','test',NOW(),'test',NOW())",tenant);
        plan=db.queryForObject("SELECT id FROM subscription_plans WHERE plan_code=?",Long.class,tenant);
        db.update("INSERT INTO tenant_subscriptions(tenant_id,subscription_plan_id,effective_start_date,renewal_date,is_trial,status,created_by,created_at,updated_by,updated_at) VALUES (?,?,'2030-01-01','2030-02-01',FALSE,'ACTIVE','test',NOW(),'test',NOW())",tenant,plan);
        subscription=db.queryForObject("SELECT id FROM tenant_subscriptions WHERE tenant_id=?",Long.class,tenant);
        db.update("INSERT INTO subscription_billing_accounts(subscription_id,tenant_id) VALUES (?,?)",subscription,tenant);
    }
    @Test void allFiveCapsUseTenantCountsAndZeroMeansNoCapacity() {
        var tx=new TransactionTemplate(manager);
        for(var resource:TenantEntitlementService.Resource.values()) tx.executeWithoutResult(s->access.requireCapacity(tenant,resource));
        db.update("UPDATE subscription_plans SET max_users=0,max_drivers=0,max_vehicles=0,max_riders=0,max_organizations=0 WHERE id=?",plan);
        for(var resource:TenantEntitlementService.Resource.values()) assertThatThrownBy(()->tx.executeWithoutResult(s->access.requireCapacity(tenant,resource)))
            .isInstanceOf(ApiException.class).hasMessageContaining("limit");
        assertThatThrownBy(()->db.update("UPDATE subscription_plans SET max_drivers=-1 WHERE id=?",plan)).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
    @Test void concurrentLastSeatAllowsOnlyOneInsertAndCountsInactiveUsers() throws Exception {
        var start=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var a=pool.submit(()->createUser(start,"one"));var b=pool.submit(()->createUser(start,"two"));start.countDown();
            assertThat(List.of(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
        }
        assertThat(db.queryForObject("SELECT COUNT(*) FROM app_users WHERE tenant_id=?",Long.class,tenant)).isEqualTo(1);
    }
    private boolean createUser(CountDownLatch start,String label) throws Exception {
        start.await(5,TimeUnit.SECONDS);
        try {
            new TransactionTemplate(manager).executeWithoutResult(s->{
                access.requireCapacity(tenant,TenantEntitlementService.Resource.USERS);
                AppUser u=new AppUser();u.setTenantId(tenant);u.setEmail(tenant+label+"@example.test");u.setPasswordHash("test");u.setStatus(UserStatus.DEACTIVATED);users.saveAndFlush(u);
            }); return true;
        } catch(ApiException conflict){return false;}
    }
    @Test void currentStatusHasNoFallbackToOlderActiveSubscription() {
        assertThat(access.evaluate(tenant).allowed()).isTrue();
        db.update("INSERT INTO tenant_subscriptions(tenant_id,subscription_plan_id,effective_start_date,renewal_date,is_trial,status,created_by,created_at,updated_by,updated_at) VALUES (?,?,'2030-01-10','2030-02-01',FALSE,'CANCELLED','test',NOW(),'test',NOW())",tenant,plan);
        assertThat(access.evaluate(tenant).state()).isEqualTo("CANCELLED");
        assertThatThrownBy(()->access.requireOperational(tenant)).isInstanceOf(ApiException.class);
        assertThat(access.evaluate("missing").allowed()).isFalse();
    }
    @Test void datesAreEnforcedAtUtcBoundariesBeforeAnyWorkerRuns() {
        db.update("UPDATE tenant_subscriptions SET effective_end_date='2030-01-15' WHERE id=?",subscription);
        assertThat(access.evaluate(tenant).state()).isEqualTo("EXPIRED");
        db.update("UPDATE tenant_subscriptions SET effective_end_date=NULL,is_trial=TRUE,status='TRIAL',trial_end_date='2030-01-15' WHERE id=?",subscription);
        assertThat(access.evaluate(tenant).allowed()).isTrue();
        clock.value=Instant.parse("2030-01-16T00:00:00Z");
        assertThat(access.evaluate(tenant).state()).isEqualTo("EXPIRED");
        db.update("UPDATE tenant_subscriptions SET is_trial=FALSE,status='ACTIVE',renewal_date='2030-01-16' WHERE id=?",subscription);
        assertThat(access.evaluate(tenant).allowed()).isTrue();
        clock.value=Instant.parse("2030-01-17T00:00:00Z");
        assertThat(access.evaluate(tenant).state()).isEqualTo("EXPIRED");
        lifecycle.reconcile(subscription);
        assertThat(db.queryForObject("SELECT status FROM tenant_subscriptions WHERE id=?",String.class,subscription)).isEqualTo("EXPIRED");
        verify(sessions).revokeAllForTenant(tenant);
    }
    @Test void overdueBalanceBlocksAccessAndSuspendsSubscription() {
        db.update("INSERT INTO platform_subscription_invoices(subscription_id,tenant_id,tenant_name,plan_code,period_start,period_end,due_date,metered_at,driver_count,driver_ids_json,monthly_driver_rate,amount,collection_mode) VALUES (?,?,'Test','TEST','2030-01-01','2030-02-01','2030-01-14',NOW(),1,'[1]',10,10,'MANUAL')",subscription,tenant);
        assertThat(access.evaluate(tenant).state()).isEqualTo("SUSPENDED");
        lifecycle.reconcile(subscription);
        assertThat(db.queryForObject("SELECT status FROM tenant_subscriptions WHERE id=?",String.class,subscription)).isEqualTo("SUSPENDED");
        verify(sessions).revokeAllForTenant(tenant);
        assertThatThrownBy(() -> subscriptions.activate(subscription)).isInstanceOf(ApiException.class).hasMessageContaining("Settle overdue");
        db.update("UPDATE platform_subscription_invoices SET paid_amount=amount,status='PAID' WHERE subscription_id=?",subscription);
        subscriptions.activate(subscription);
        assertThat(access.evaluate(tenant).allowed()).isTrue();
    }
    @Test void manualSuspensionAndCancellationImmediatelyDenyAccess() {
        subscriptions.suspend(subscription);
        assertThatThrownBy(()->access.requireOperational(tenant)).isInstanceOf(ApiException.class);
        subscriptions.activate(subscription);
        assertThat(access.evaluate(tenant).allowed()).isTrue();
        subscriptions.cancel(subscription);
        assertThat(access.evaluate(tenant).state()).isEqualTo("CANCELLED");
        verify(sessions,times(2)).revokeAllForTenant(tenant);
    }
    @Test void managedRenewalCanRecoverWithoutGrantingAccessWhileDelayed() {
        db.update("UPDATE subscription_billing_accounts SET enabled=TRUE WHERE subscription_id=?", subscription);
        db.update("UPDATE tenant_subscriptions SET renewal_date='2030-01-14' WHERE id=?", subscription);
        assertThat(access.evaluate(tenant).allowed()).isFalse();
        lifecycle.reconcile(subscription);
        assertThat(db.queryForObject("SELECT status FROM tenant_subscriptions WHERE id=?",String.class,subscription)).isEqualTo("ACTIVE");
        db.update("UPDATE tenant_subscriptions SET renewal_date='2030-02-14' WHERE id=?", subscription);
        assertThat(access.evaluate(tenant).allowed()).isTrue();
    }
    @Test void missingDatesAndFutureOnlySubscriptionsFailClosed() {
        db.update("UPDATE tenant_subscriptions SET renewal_date=NULL WHERE id=?", subscription);
        assertThat(access.evaluate(tenant).allowed()).isFalse();
        db.update("UPDATE tenant_subscriptions SET renewal_date='2030-03-01',effective_start_date='2030-02-01' WHERE id=?", subscription);
        assertThat(access.evaluate(tenant).allowed()).isFalse();
    }
    @Test void concurrentSubscriptionCreationCannotCreateTwoCurrentSubscriptions() throws Exception {
        subscriptions.cancel(subscription);
        var start=new CountDownLatch(1);
        var request=new com.transportplatform.tms.features.saas.api.request.TenantSubscriptionUpsertRequest(
            tenant,plan,LocalDate.of(2030,1,15),null,LocalDate.of(2030,2,15),false,null,null,TenantSubscriptionStatus.ACTIVE);
        try(var pool=Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Boolean> create=()->{start.await(5,TimeUnit.SECONDS);try{subscriptions.create(request);return true;}catch(ApiException conflict){return false;}};
            var a=pool.submit(create);var b=pool.submit(create);start.countDown();
            assertThat(List.of(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
        }
        assertThat(db.queryForObject("SELECT COUNT(*) FROM tenant_subscriptions WHERE tenant_id=? AND status='ACTIVE'",Long.class,tenant)).isEqualTo(1);
    }

    @Test void pendingOwnerProvisioningStillChecksPlanCapacity() {
        db.update("UPDATE tenants SET status='PENDING' WHERE id=?",tenant);
        assertThat(access.evaluate(tenant).allowed()).isFalse();
        new TransactionTemplate(manager).executeWithoutResult(s->access.requireOwnerCapacity(tenant));
        db.update("UPDATE subscription_plans SET max_users=0 WHERE id=?",plan);
        assertThatThrownBy(()->new TransactionTemplate(manager).executeWithoutResult(s->access.requireOwnerCapacity(tenant))).isInstanceOf(ApiException.class);
    }
}
