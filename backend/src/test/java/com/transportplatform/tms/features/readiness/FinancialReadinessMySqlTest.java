package com.transportplatform.tms.features.readiness;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.concurrency.WorkflowLockService;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.application.*;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.driverearnings.application.DriverPayoutService;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.route.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.settings.application.TenantTimeService;
import java.math.*;
import java.time.*;
import java.util.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@DataJpaTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
@Import({JpaAuditConfig.class,WorkflowLockService.class,FinancialRequestService.class,BillingSourceService.class,
        BillingReferenceValidationService.class,BillingReconciliationService.class,DriverPayoutService.class,com.transportplatform.tms.features.driverearnings.application.DriverEarningsService.class,FinancialReadinessMySqlTest.Config.class})
@Testcontainers
class FinancialReadinessMySqlTest {
    @Container static MySQLContainer<?> mysql=new MySQLContainer<>("mysql:8.0.45");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",mysql::getJdbcUrl);r.add("spring.datasource.username",mysql::getUsername);r.add("spring.datasource.password",mysql::getPassword);
    }
    @TestConfiguration static class Config {
        @Bean ObjectMapper mapper() { return new ObjectMapper().findAndRegisterModules(); }
    }
    @Autowired EntityManager em; @Autowired JdbcTemplate db; @Autowired BillingSourceService sources;
    @Autowired DriverPayoutService payouts;
    @Autowired com.transportplatform.tms.features.driverearnings.application.DriverEarningsService earnings;
    @Autowired WorkflowLockService locks;
    @Autowired BillingReconciliationService reconciliation;
    @MockitoBean BillingAccessService billingAccess;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
    @MockitoBean CurrentAuthenticatedUserService users;
    @MockitoBean DriverPortalAccessService driverAccess;
    @MockitoBean TenantTimeService time;
    @MockitoBean AuditLogService audit;
    @MockitoBean com.transportplatform.tms.features.tripevidence.application.TripEvidenceService evidence;
    String tenant; Rider rider;
    @BeforeEach void setup() {
        tenant=UUID.randomUUID().toString();
        when(billingAccess.requireCompanyTenantId()).thenReturn(tenant);
        Tenant t=new Tenant();t.setId(tenant);t.setTenantCode(tenant);t.setCompanyName("Test Transport");t.setLegalName("Test "+tenant);t.setEmail("test@example.com");t.setPhone("5551234567");t.setAddressLine1("1 Main St");t.setCity("Boston");t.setState("MA");t.setZipCode("02110");t.setCountry("US");t.setBusinessType("Transport");t.setSubscriptionPlan("STANDARD");t.setStatus(TenantStatus.ACTIVE);em.persist(t);
        rider=new Rider();rider.setTenantId(tenant);rider.setRiderCode("R-1");rider.setFirstName("Test");rider.setLastName("Rider");rider.setPrimaryPhone("5551234567");rider.setRiderType(RiderType.STUDENT);rider.setStatus(RiderStatus.ACTIVE);em.persist(rider);em.flush();
        when(users.requireCurrentUser()).thenReturn(new AuthenticatedUser(1L,tenant,"admin@example.com","Test","Admin","",true,true,false,List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))));
        when(time.today(tenant)).thenReturn(LocalDate.of(2026,11,25));
    }
    Ride ride(String code,RideStatus status) {
        Ride r=new Ride();r.setTenantId(tenant);r.setRideNumber(code);r.setRider(rider);r.setServiceType(com.transportplatform.tms.features.organization.domain.ServiceType.GENERAL_TRANSPORT);r.setTripType(RideTripType.ONE_WAY);r.setStatus(status);
        r.setPickupAddressLine1("1 Main St");r.setPickupCity("Boston");r.setPickupState("MA");r.setPickupZipCode("02110");r.setPickupCountry("US");r.setDropoffAddressLine1("2 Main St");r.setDropoffCity("Boston");r.setDropoffState("MA");r.setDropoffZipCode("02110");r.setDropoffCountry("US");r.setScheduledPickupAt(LocalDateTime.of(2026,11,25,9,0));em.persist(r);em.flush();return r;
    }
    Route route(Ride... rides) {
        Route r=new Route();r.setTenantId(tenant);r.setRouteCode("ROUTE-"+UUID.randomUUID());r.setRouteName("Test route");r.setRouteDate(LocalDate.of(2026,11,25));r.setServiceType(com.transportplatform.tms.features.organization.domain.ServiceType.GENERAL_TRANSPORT);r.setStatus(RouteStatus.COMPLETED);r.setBillToType(BillToType.RIDER);r.setBillToId(rider.getId());em.persist(r);
        int n=0;for(var trip:rides) { RouteStop s=new RouteStop();s.setTenantId(tenant);s.setRoute(r);s.setRide(trip);s.setStopSequence(++n);s.setStatus(RouteStopStatus.COMPLETED);em.persist(s); }em.flush();return r;
    }
    Invoice invoice() {
        Invoice i=new Invoice();i.setTenantId(tenant);i.setInvoiceNumber(UUID.randomUUID().toString());i.setBillToType(BillToType.RIDER);i.setBillToId(rider.getId());i.setBillToNameSnapshot("Test rider");i.setInvoiceDate(LocalDate.of(2026,11,25));i.setDueDate(LocalDate.of(2026,12,25));i.setStatus(InvoiceStatus.DRAFT);i.setCurrency("USD");i.setTaxAmount(BigDecimal.ZERO);i.setDiscountAmount(BigDecimal.ZERO);i.setSubtotal(BigDecimal.TEN);i.setTotalAmount(BigDecimal.TEN);i.setAmountPaid(BigDecimal.ZERO);i.setBalanceDue(BigDecimal.TEN);em.persist(i);em.flush();return i;
    }
    InvoiceLineItem line(Invoice invoice,ChargeSourceType type,long source,String amount) {
        var l=new InvoiceLineItem();l.setTenantId(tenant);l.setInvoice(invoice);l.setLineNumber(1);l.setDescription("Service");l.setChargeSourceType(type);l.setSourceReferenceId(source);l.setQuantity(BigDecimal.ONE);l.setUnitPrice(new BigDecimal(amount));l.setLineAmount(new BigDecimal(amount));return l;
    }
    @Test void routeClaimsBlockIndividualTripAndAnotherRouteThenReleaseOnVoid() {
        Ride a=ride("A",RideStatus.COMPLETED);Route r=route(a);Invoice i=invoice();var l=line(i,ChargeSourceType.ROUTE,r.getId(),"10.00");
        sources.validate(i,List.of(l));em.persist(l);em.flush();sources.sync(i,List.of(l));
        var other=invoice();var direct=line(other,ChargeSourceType.RIDE,a.getId(),"10.00");
        assertThatThrownBy(()->sources.validate(other,List.of(direct))).hasMessageContaining("already included");
        Route second=route(a);assertThatThrownBy(()->sources.validate(other,List.of(line(other,ChargeSourceType.ROUTE,second.getId(),"10.00")))).hasMessageContaining("already included");
        i.setStatus(InvoiceStatus.VOID);em.flush();db.update("UPDATE invoice_ride_allocations SET claim_active=FALSE WHERE invoice_id=?",i.getId());db.update("DELETE FROM invoice_route_claims WHERE line_item_id=?",l.getId());
        sources.validate(other,List.of(direct));em.persist(direct);em.flush();sources.sync(other,List.of(direct));
        assertThat(db.queryForObject("SELECT COUNT(*) FROM invoice_ride_allocations WHERE tenant_id=? AND claim_active=TRUE",Long.class,tenant)).isEqualTo(1);
    }
    @Test void allocationsPreserveCentsAndOnlyCompletedTripsEarn() {
        var a=ride("A",RideStatus.COMPLETED);var b=ride("B",RideStatus.COMPLETED);var failed=ride("C",RideStatus.FAILED);var r=route(a,b,failed);var i=invoice();var l=line(i,ChargeSourceType.ROUTE,r.getId(),"10.01");
        sources.validate(i,List.of(l));em.persist(l);em.flush();sources.sync(i,List.of(l));
        assertThat(db.queryForList("SELECT amount FROM invoice_ride_allocations WHERE tenant_id=? ORDER BY ride_id",BigDecimal.class,tenant)).containsExactly(new BigDecimal("5.01"),new BigDecimal("5.00"),new BigDecimal("0.00"));
    }
    @Test void sourceCannotReferenceOtherTenantRouteOrWrongRider() {
        var a=ride("A",RideStatus.COMPLETED);var i=invoice();i.setBillToId(rider.getId()+999);
        assertThatThrownBy(()->sources.validate(i,List.of(line(i,ChargeSourceType.RIDE,a.getId(),"10.00")))).hasMessageContaining("billing account");
        assertThatThrownBy(()->sources.validate(i,List.of(line(i,ChargeSourceType.ROUTE,999999L,"10.00")))).hasMessageContaining("Route was not found");
    }
    @Test void manualPayoutIsIdempotentBoundedAllocatedAndReversible() {
        Driver d=new Driver();d.setTenantId(tenant);d.setDriverCode("DRIVER-1");d.setFirstName("Test");d.setLastName("Driver");d.setPhone("5551234567");d.setDriverType(DriverType.EMPLOYEE);d.setStatus(DriverStatus.ACTIVE);d.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);d.setDrugTestStatus(DriverQualificationStatus.CLEAR);d.setTrainingStatus(DriverTrainingStatus.COMPLETED);em.persist(d);em.flush();
        db.update("INSERT INTO driver_earnings_ledger(tenant_id,driver_id,entry_type,status,amount,currency,reason,created_by,created_at,updated_by,updated_at) VALUES(?,?,'ADJUSTMENT','APPROVED',100,'USD','test','test',UTC_TIMESTAMP(6),'test',UTC_TIMESTAMP(6))",tenant,d.getId());
        var request=new DriverPayoutService.PayoutRequest(d.getId(),new BigDecimal("60.00"),LocalDate.of(2026,11,25),"BANK-1",null);
        assertThat(payouts.record(request,"pay-1").outstanding()).isEqualByComparingTo("40.00");
        var replay=payouts.record(request,"pay-1");assertThat(replay.payouts()).hasSize(1);
        assertThat(db.queryForObject("SELECT SUM(amount) FROM driver_payout_allocations WHERE payout_id=?",BigDecimal.class,replay.payouts().getFirst().id())).isEqualByComparingTo("60.00");
        long id=replay.payouts().getFirst().id();
        var reversal=new DriverPayoutService.Reversal("Incorrect receipt");
        assertThat(payouts.reverse(id,reversal,"undo-1").outstanding()).isEqualByComparingTo("100.00");
        assertThat(payouts.reverse(id,reversal,"undo-1").payouts()).hasSize(1);
        payouts.record(new DriverPayoutService.PayoutRequest(d.getId(),new BigDecimal("60.00"),request.paidOn(),"BANK-2",null),"pay-2");
        assertThatThrownBy(()->payouts.record(new DriverPayoutService.PayoutRequest(d.getId(),new BigDecimal("41.00"),request.paidOn(),"BANK-3",null),"pay-3")).hasMessageContaining("cannot exceed");
    }
    @Test void concurrentPayoutsCannotSpendTheSameApprovedBalance() throws Exception {
        Driver d=new Driver();d.setTenantId(tenant);d.setDriverCode("CONCURRENT");d.setFirstName("Test");d.setLastName("Driver");d.setPhone("5551234567");d.setDriverType(DriverType.EMPLOYEE);d.setStatus(DriverStatus.ACTIVE);d.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);d.setDrugTestStatus(DriverQualificationStatus.CLEAR);d.setTrainingStatus(DriverTrainingStatus.COMPLETED);em.persist(d);em.flush();
        db.update("INSERT INTO driver_earnings_ledger(tenant_id,driver_id,entry_type,status,amount,currency,reason,created_by,created_at,updated_by,updated_at) VALUES(?,?,'ADJUSTMENT','APPROVED',100,'USD','test','test',UTC_TIMESTAMP(6),'test',UTC_TIMESTAMP(6))",tenant,d.getId());
        org.springframework.test.context.transaction.TestTransaction.flagForCommit();org.springframework.test.context.transaction.TestTransaction.end();
        var start=new java.util.concurrent.CountDownLatch(1);
        try(var executor=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var first=executor.submit(()->payAfter(start,d.getId(),"concurrent-1"));var second=executor.submit(()->payAfter(start,d.getId(),"concurrent-2"));start.countDown();
            assertThat(List.of(first.get(),second.get())).containsExactlyInAnyOrder(true,false);
        }
        assertThat(payouts.account(d.getId()).paidAmount()).isEqualByComparingTo("60.00");
    }
    private boolean payAfter(java.util.concurrent.CountDownLatch start,long driver,String reference) throws Exception {
        start.await();
        try { payouts.record(new DriverPayoutService.PayoutRequest(driver,new BigDecimal("60.00"),LocalDate.of(2026,11,25),reference,null),reference);return true; }
        catch(com.transportplatform.tms.common.exception.ApiException conflict) { return false; }
    }
    @Test void approvalWaitsForInvoiceVoidAndCannotRestoreStaleEarnings() throws Exception {
        var trip=ride("CONCURRENT-TRIP",RideStatus.COMPLETED);var invoice=invoice();invoice.setStatus(InvoiceStatus.ISSUED);invoice.setSubtotal(new BigDecimal("100.00"));invoice.setTotalAmount(new BigDecimal("100.00"));invoice.setBalanceDue(new BigDecimal("100.00"));
        Driver d=new Driver();d.setTenantId(tenant);d.setDriverCode("EARNINGS");d.setFirstName("Test");d.setLastName("Driver");d.setPhone("5551234567");d.setDriverType(DriverType.EMPLOYEE);d.setStatus(DriverStatus.ACTIVE);d.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);d.setDrugTestStatus(DriverQualificationStatus.CLEAR);d.setTrainingStatus(DriverTrainingStatus.COMPLETED);em.persist(d);em.flush();
        var line=line(invoice,ChargeSourceType.RIDE,trip.getId(),"100.00");em.persist(line);em.flush();sources.sync(invoice,List.of(line));
        var entry=new com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedger();entry.setTenantId(tenant);entry.setDriverId(d.getId());entry.setRideId(trip.getId());entry.setEntryType(com.transportplatform.tms.features.driverearnings.domain.DriverEarningsEntryType.EARNED);entry.setStatus(com.transportplatform.tms.features.driverearnings.domain.DriverEarningsStatus.PENDING_REVIEW);entry.setCurrency("USD");entry.setAmount(new BigDecimal("10.00"));entry.setEarningsRate(new BigDecimal("10.00"));entry.setBillableAmount(new BigDecimal("100.00"));entry.setSourceInvoiceId(invoice.getId());em.persist(entry);em.flush();
        org.springframework.test.context.transaction.TestTransaction.flagForCommit();org.springframework.test.context.transaction.TestTransaction.end();
        var held=new java.util.concurrent.CountDownLatch(1);var release=new java.util.concurrent.CountDownLatch(1);var tx=new org.springframework.transaction.support.TransactionTemplate(transactions);
        try(var executor=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var voider=executor.submit(()->tx.executeWithoutResult(status->{locks.lock(tenant,"FINANCE",0);db.update("UPDATE invoices SET status='VOID' WHERE id=?",invoice.getId());db.update("UPDATE invoice_ride_allocations SET claim_active=FALSE WHERE invoice_id=?",invoice.getId());earnings.reconcileRide(tenant,trip.getId());held.countDown();try { if(!release.await(10,java.util.concurrent.TimeUnit.SECONDS)) throw new AssertionError("Approval did not start"); } catch(InterruptedException e) { throw new RuntimeException(e); }}));
            assertThat(held.await(10,java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            var approver=executor.submit(()->{try { earnings.approve(entry.getId());return true; } catch(com.transportplatform.tms.common.exception.ApiException conflict) { return false; }});
            assertThatThrownBy(() -> approver.get(200, java.util.concurrent.TimeUnit.MILLISECONDS)).isInstanceOf(java.util.concurrent.TimeoutException.class);
            release.countDown();voider.get();assertThat(approver.get()).isFalse();
        } finally { release.countDown(); }
        assertThat(db.queryForObject("SELECT status FROM driver_earnings_ledger WHERE id=?",String.class,entry.getId())).isEqualTo("PENDING_CALCULATION");
    }
    @Test void fractionalCentLinesRemainBalancedAfterDatabaseReload() {
        var invoice=invoice();var mapper=new InvoiceMapper();
        var request=new com.transportplatform.tms.features.billing.api.request.InvoiceLineItemUpsertRequest("Fractional unit",ChargeSourceType.MANUAL,null,null,new BigDecimal("0.50"),new BigDecimal("0.01"),null,null,null);
        var first=mapper.toLineItem(invoice,request);first.setLineNumber(1);var second=mapper.toLineItem(invoice,request);second.setLineNumber(2);
        new InvoiceFinancialService().recalculateTotals(invoice,List.of(first,second),LocalDate.of(2026,11,25));
        em.persist(first);em.persist(second);em.flush();em.clear();
        assertThat(db.queryForObject("SELECT subtotal FROM invoices WHERE id=?",BigDecimal.class,invoice.getId())).isEqualByComparingTo("0.02");
        assertThat(db.queryForObject("SELECT SUM(line_amount) FROM invoice_line_items WHERE invoice_id=?",BigDecimal.class,invoice.getId())).isEqualByComparingTo("0.02");
        assertThat(reconciliation.report().get("invoice_totals")).isEmpty();
    }
    @Test void reconciliationFindsLegacyDiscrepancyWithoutChangingItsAmount() {
        var invoice=invoice();
        assertThat(reconciliation.report().get("invoice_totals")).hasSize(1);
        var trip=ride("LEGACY",RideStatus.COMPLETED);invoice.setBillToId(rider.getId()+1000);
        var wrongPayer=line(invoice,ChargeSourceType.RIDE,trip.getId(),"10.00");em.persist(wrongPayer);
        var missingRoute=line(invoice,ChargeSourceType.ROUTE,999999L,"10.00");missingRoute.setLineNumber(2);em.persist(missingRoute);em.flush();
        assertThat(reconciliation.report().get("payer_source_mismatch")).hasSize(1);
        assertThat(reconciliation.report().get("invalid_service_references")).hasSize(1);
        assertThat(db.queryForObject("SELECT total_amount FROM invoices WHERE id=?",BigDecimal.class,invoice.getId())).isEqualByComparingTo("10.00");
    }
}
