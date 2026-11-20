package com.transportplatform.tms.features.subscriptionbilling.application;

import static com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.saas.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.*;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@DataJpaTest(properties = {"spring.flyway.enabled=true", "app.subscription-billing.enabled=false"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
  JpaAuditConfig.class,
  SubscriptionBillingService.class,
  SubscriptionAutomaticCollectionService.class,
  SubscriptionProvisioningService.class,
  AuditLogService.class,
  CurrentAuthenticatedUserService.class,
  SubscriptionBillingMySqlTest.Config.class
})
@Testcontainers
class SubscriptionBillingMySqlTest {
  @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", MYSQL::getJdbcUrl);
    r.add("spring.datasource.username", MYSQL::getUsername);
    r.add("spring.datasource.password", MYSQL::getPassword);
  }

  static class MutableClock extends Clock {
    Instant value = Instant.now();

    public ZoneId getZone() {
      return ZoneOffset.UTC;
    }

    public Clock withZone(ZoneId z) {
      return this;
    }

    public Instant instant() {
      return value;
    }
  }

  @TestConfiguration
  static class Config {
    @Bean
    MutableClock clock() {
      return new MutableClock();
    }

    @Bean
    ObjectMapper mapper() {
      return new ObjectMapper().findAndRegisterModules();
    }

    @Bean
    JdbcTemplate jdbc(DataSource source) {
      return new JdbcTemplate(source);
    }
  }

  @Autowired SubscriptionBillingService billing;
  @Autowired SubscriptionAutomaticCollectionService automatic;
  @Autowired SubscriptionProvisioningService provisioning;
  @Autowired TenantRepository tenants;
  @Autowired SubscriptionPlanRepository plans;
  @Autowired TenantSubscriptionRepository subscriptions;
  @Autowired DriverRepository drivers;
  @Autowired MutableClock clock;
  @Autowired JdbcTemplate db;
  @MockitoBean SubscriptionPaymentCollector provider;
  Tenant tenant;
  TenantSubscription subscription;
  Driver active;

  @BeforeEach
  void setup() {
    reset(provider);
    when(provider.available()).thenReturn(false);
    clock.value = Instant.now().plusSeconds(2);
    var user =
        new AuthenticatedUser(
            null,
            null,
            "billing-admin@example.test",
            "Billing",
            "Admin",
            "",
            true,
            true,
            false,
            List.of(new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN")));
    SecurityContextHolder.getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    String id = UUID.randomUUID().toString();
    Tenant t = new Tenant();
    t.setId(id);
    t.setTenantCode(id);
    t.setCompanyName("Billing test " + id.substring(0, 8));
    t.setLegalName(t.getCompanyName());
    t.setEmail(id + "@example.test");
    t.setPhone("5551234567");
    t.setAddressLine1("1 Main St");
    t.setCity("Boston");
    t.setState("MA");
    t.setZipCode("02110");
    t.setCountry("US");
    t.setBusinessType("TRANSPORT");
    t.setSubscriptionPlan("P" + id.substring(0, 8));
    t.setStatus(TenantStatus.ACTIVE);
    tenant = tenants.saveAndFlush(t);
    SubscriptionPlan p = new SubscriptionPlan();
    p.setPlanCode(t.getSubscriptionPlan());
    p.setName("Per driver");
    p.setTier(SubscriptionPlanTier.CUSTOM);
    p.setMonthlyPrice(BigDecimal.ZERO);
    p.setAnnualPrice(BigDecimal.ZERO);
    p.setCurrency("USD");
    p.setStatus(SubscriptionPlanStatus.ACTIVE);
    plans.saveAndFlush(p);
    provisioning.provision(tenant);
    subscription =
        subscriptions.findAllByTenant_IdOrderByEffectiveStartDateDescCreatedAtDesc(id).getFirst();
    active = driver("A", DriverStatus.ACTIVE);
    driver("S", DriverStatus.SUSPENDED);
    driver("T", DriverStatus.TERMINATED);
    clock.value = Instant.now().plusSeconds(3);
  }

  @AfterEach
  void clear() {
    SecurityContextHolder.clearContext();
  }

  LocalDate today() {
    return LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
  }

  Driver driver(String suffix, DriverStatus status) {
    Driver d = new Driver();
    d.setTenantId(tenant.getId());
    d.setDriverCode("D-" + suffix);
    d.setFirstName("Driver");
    d.setLastName(suffix);
    d.setPhone("5551234567");
    d.setDriverType(DriverType.EMPLOYEE);
    d.setStatus(status);
    d.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);
    d.setDrugTestStatus(DriverQualificationStatus.CLEAR);
    d.setTrainingStatus(DriverTrainingStatus.COMPLETED);
    return drivers.saveAndFlush(d);
  }

  void configure() {
    billing.configure(
        subscription.getId(), new Configure(new BigDecimal("25.00"), today(), 14, "MANUAL", true));
  }

  @Test
  void provisioningCreatesSubscriptionAndUnconfiguredBillingAccountIdempotently() {
    provisioning.provision(tenant);
    assertThat(
            subscriptions.findAllByTenant_IdOrderByEffectiveStartDateDescCreatedAtDesc(
                tenant.getId()))
        .hasSize(1);
    var a = billing.account(subscription.getId(), tenant.getId());
    assertThat(a.enabled()).isFalse();
    assertThat(a.monthlyDriverRate()).isNull();
    assertThat(billing.generateRenewal(subscription.getId())).isNull();
  }

  @Test
  void renewalsMeterOnlyActiveDriversAndStoreImmutableRatesAndCount() {
    configure();
    long id = billing.generateRenewal(subscription.getId());
    Invoice first = billing.invoice(id, tenant.getId());
    assertThat(first.driverCount()).isEqualTo(1);
    assertThat(first.amount()).isEqualByComparingTo("25.00");
    assertThat(first.currency()).isEqualTo("USD");
    assertThat(first.driverIdsJson()).contains(active.getId().toString());
    assertThat(billing.generateRenewal(subscription.getId())).isNull();
    driver("NEW", DriverStatus.ACTIVE);
    billing.configure(
        subscription.getId(), new Configure(new BigDecimal("30.00"), today(), 14, "MANUAL", true));
    assertThat(billing.invoice(id, null).amount()).isEqualByComparingTo("25.00");
    var next = billing.account(subscription.getId(), null).nextRenewalAt();
    clock.value = next;
    long second = billing.generateRenewal(subscription.getId());
    assertThat(billing.invoice(second, null).driverCount()).isEqualTo(2);
    assertThat(billing.invoice(second, null).amount()).isEqualByComparingTo("60.00");
  }

  @Test
  void partialManualPaymentsAreIdempotentAndCannotOverpayOrCrossTenant() {
    configure();
    long id = billing.generateRenewal(subscription.getId());
    assertThatThrownBy(() -> billing.invoice(id, "another-tenant"))
        .isInstanceOf(ApiException.class);
    assertThat(billing.invoices("another-tenant", null, 0, 10).items()).isEmpty();
    billing.recordManualPayment(id, new PaymentRequest(new BigDecimal("10.00"), "BANK-1"));
    billing.recordManualPayment(id, new PaymentRequest(new BigDecimal("10.00"), "BANK-1"));
    assertThat(billing.invoice(id, null).paidAmount()).isEqualByComparingTo("10.00");
    assertThat(billing.detail(id, null).payments()).hasSize(1);
    assertThatThrownBy(
            () ->
                billing.recordManualPayment(
                    id, new PaymentRequest(new BigDecimal("16.00"), "BANK-2")))
        .isInstanceOf(ApiException.class);
    billing.recordManualPayment(id, new PaymentRequest(new BigDecimal("15.00"), "BANK-2"));
    assertThat(billing.invoice(id, null).status()).isEqualTo("PAID");
  }

  @Test
  void unavailableAutomaticProviderCannotBeEnabled() {
    assertThatThrownBy(
            () ->
                billing.configure(
                    subscription.getId(),
                    new Configure(new BigDecimal("25.00"), today(), 14, "AUTOMATIC", true)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void automaticModeRequiresVerifiedMatchingSettlementAndUsesStableInvoiceKey() {
    when(provider.available()).thenReturn(true);
    billing.configure(
        subscription.getId(),
        new Configure(new BigDecimal("25.00"), today(), 14, "AUTOMATIC", true));
    long id = billing.generateRenewal(subscription.getId());
    when(provider.collect(any(), eq("bakaroo-subscription-invoice-" + id)))
        .thenReturn(
            new SubscriptionPaymentCollector.Result(
                true, "PROVIDER-1", new BigDecimal("25.00"), "USD"));
    automatic.collect(id);
    assertThat(billing.invoice(id, null).status()).isEqualTo("PAID");
    automatic.collect(id);
    verify(provider, times(1)).collect(any(), anyString());
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void unknownAutomaticOutcomeRemainsPendingAndBlocksManualDoubleCollection() {
    when(provider.available()).thenReturn(true);
    billing.configure(
        subscription.getId(),
        new Configure(new BigDecimal("25.00"), today(), 14, "AUTOMATIC", true));
    long id = billing.generateRenewal(subscription.getId());
    when(provider.collect(any(), anyString()))
        .thenThrow(new IllegalStateException("network timeout"));
    automatic.collect(id);
    assertThat(billing.invoice(id, null).collectionState()).isEqualTo("PENDING");
    assertThatThrownBy(
            () ->
                billing.recordManualPayment(
                    id, new PaymentRequest(new BigDecimal("25.00"), "MANUAL-RISK")))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void driverStatusTriggerClosesIntervalsAndZeroDriverRenewalIsPaid() {
    active.setStatus(DriverStatus.INACTIVE);
    drivers.saveAndFlush(active);
    clock.value = Instant.now().plusSeconds(4);
    configure();
    long id = billing.generateRenewal(subscription.getId());
    assertThat(billing.invoice(id, null).driverCount()).isZero();
    assertThat(billing.invoice(id, null).status()).isEqualTo("PAID");
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM subscription_driver_status_periods WHERE driver_id=?",
                Integer.class,
                active.getId()))
        .isEqualTo(2);
  }

  @Test
  void trialAndInactiveSubscriptionsDoNotChargeBeforeEligibility() {
    subscription.setTrial(true);
    subscription.setStatus(TenantSubscriptionStatus.TRIAL);
    subscription.setTrialEndDate(today().plusDays(3));
    subscriptions.saveAndFlush(subscription);
    assertThatThrownBy(() -> configure()).isInstanceOf(ApiException.class);
    billing.configure(
        subscription.getId(),
        new Configure(new BigDecimal("25.00"), today().plusDays(4), 14, "MANUAL", true));
    assertThat(billing.generateRenewal(subscription.getId())).isNull();
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void concurrentRenewalsIssueOnlyOneInvoice() throws Exception {
    configure();
    try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
      var start = new java.util.concurrent.CountDownLatch(1);
      var a =
          pool.submit(
              () -> {
                start.await();
                return billing.generateRenewal(subscription.getId());
              });
      var b =
          pool.submit(
              () -> {
                start.await();
                return billing.generateRenewal(subscription.getId());
              });
      start.countDown();
      var results = new java.util.ArrayList<Long>();
      results.add(a.get(20, java.util.concurrent.TimeUnit.SECONDS));
      results.add(b.get(20, java.util.concurrent.TimeUnit.SECONDS));
      assertThat(results.stream().filter(java.util.Objects::nonNull).count()).isEqualTo(1);
      assertThat(billing.invoices(tenant.getId(), subscription.getId(), 0, 10).totalElements())
          .isEqualTo(1);
    }
  }

  @Test
  void inactiveSubscriptionAutomaticallyDisablesItsBillingAccount() {
    configure();
    subscription.setStatus(TenantSubscriptionStatus.CANCELLED);
    subscriptions.saveAndFlush(subscription);
    assertThat(billing.account(subscription.getId(), null).enabled()).isFalse();
    assertThat(billing.generateRenewal(subscription.getId())).isNull();
  }

  @Test
  void expiredUnconvertedTrialIsExpiredWithoutAnInvoice() {
    subscription.setTrial(true);
    subscription.setStatus(TenantSubscriptionStatus.TRIAL);
    subscription.setTrialEndDate(today().minusDays(1));
    subscriptions.saveAndFlush(subscription);
    billing.expireTrial(subscription.getId());
    assertThat(billing.account(subscription.getId(), null).subscriptionStatus())
        .isEqualTo("EXPIRED");
    assertThat(billing.invoices(tenant.getId(), subscription.getId(), 0, 10).items()).isEmpty();
  }

  @Test
  void delayedJobsUseStatusAtTheRenewalBoundaryAndDoNotRepriceOldPeriods() {
    configure();
    var firstAt = billing.account(subscription.getId(), null).nextRenewalAt();
    active.setStatus(DriverStatus.INACTIVE);
    drivers.saveAndFlush(active);
    db.update("DELETE FROM subscription_driver_status_periods WHERE driver_id=?", active.getId());
    db.update(
        "INSERT INTO"
            + " subscription_driver_status_periods(tenant_id,driver_id,status,effective_from,effective_to)"
            + " VALUES(?,?,'ACTIVE',?,?)",
        tenant.getId(),
        active.getId(),
        java.sql.Timestamp.from(firstAt.minusSeconds(86400)),
        java.sql.Timestamp.from(firstAt.plusSeconds(86400)));
    db.update(
        "INSERT INTO subscription_driver_status_periods(tenant_id,driver_id,status,effective_from)"
            + " VALUES(?,?,'INACTIVE',?)",
        tenant.getId(),
        active.getId(),
        java.sql.Timestamp.from(firstAt.plusSeconds(86400)));
    var firstDate = LocalDate.ofInstant(firstAt, ZoneOffset.UTC);
    clock.value = firstAt.plusSeconds(70L * 86400);
    billing.configure(
        subscription.getId(),
        new Configure(new BigDecimal("40.00"), firstDate, 14, "MANUAL", true));
    long first = billing.generateRenewal(subscription.getId());
    assertThat(billing.invoice(first, null).driverCount()).isEqualTo(1);
    assertThat(billing.invoice(first, null).amount()).isEqualByComparingTo("25.00");
    long second = billing.generateRenewal(subscription.getId());
    assertThat(billing.invoice(second, null).driverCount()).isZero();
    assertThat(billing.invoice(second, null).monthlyDriverRate()).isEqualByComparingTo("25.00");
  }
}
