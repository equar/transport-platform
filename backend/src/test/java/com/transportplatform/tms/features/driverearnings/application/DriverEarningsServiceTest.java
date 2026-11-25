package com.transportplatform.tms.features.driverearnings.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItemRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsEntryType;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedger;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedgerRepository;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsStatus;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsReviewRequest;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class DriverEarningsServiceTest {

    private final DriverEarningsLedgerRepository ledger = mock(DriverEarningsLedgerRepository.class);
    private final InvoiceLineItemRepository invoiceLineItems = mock(InvoiceLineItemRepository.class);
    private final TenantSettingsRepository settings = mock(TenantSettingsRepository.class);
    private final DriverPortalAccessService driverAccess = mock(DriverPortalAccessService.class);
    private final CurrentAuthenticatedUserService currentUser = mock(CurrentAuthenticatedUserService.class);
    private final DriverRepository drivers = mock(DriverRepository.class);
    private final RideRepository rides = mock(RideRepository.class);
    private final AuditLogService audit = mock(AuditLogService.class);
    private final DriverEarningsService service = new DriverEarningsService(
            ledger, invoiceLineItems, settings, driverAccess, currentUser, drivers, rides, audit, org.mockito.Mockito.mock(com.transportplatform.tms.features.tripevidence.application.TripEvidenceService.class));

    @BeforeEach
    void returnSavedLedgerEntryFromRepository() {
        org.springframework.test.util.ReflectionTestUtils.setField(service,"financialLocks",mock(com.transportplatform.tms.common.concurrency.WorkflowLockService.class));
        org.springframework.test.util.ReflectionTestUtils.setField(service,"db",mock(org.springframework.jdbc.core.JdbcTemplate.class));
        when(ledger.save(any(DriverEarningsLedger.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void completedRideEarningsUseThatRidesIssuedLineAmountAndWaitForApproval() {
        when(ledger.existsByRideIdAndEntryType(42L, DriverEarningsEntryType.EARNED)).thenReturn(false);
        when(settings.findById("tenant-1")).thenReturn(Optional.of(tenantSettings("15.00")));
        List<InvoiceLineItem> rideLineItems = List.of(issuedRideLine(42L, "125.00", "900.00"));
        when(invoiceLineItems.findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc(
                "tenant-1", ChargeSourceType.RIDE, 42L)).thenReturn(rideLineItems);
        var ride = mock(com.transportplatform.tms.features.ride.domain.Ride.class);
        when(ride.getId()).thenReturn(42L);
        when(ride.getTenantId()).thenReturn("tenant-1");
        when(ride.getDriverId()).thenReturn(9L);

        service.createForCompletedRide(ride);

        ArgumentCaptor<DriverEarningsLedger> savedEntry = ArgumentCaptor.forClass(DriverEarningsLedger.class);
        org.mockito.Mockito.verify(ledger).save(savedEntry.capture());
        assertEquals(new BigDecimal("125.00"), savedEntry.getValue().getBillableAmount());
        assertEquals(new BigDecimal("18.75"), savedEntry.getValue().getAmount());
        assertEquals(DriverEarningsStatus.PENDING_REVIEW, savedEntry.getValue().getStatus());
    }

    @Test
    void issuingRideChargeRecalculatesPendingRecordForAdminReview() {
        when(settings.findById("tenant-1")).thenReturn(Optional.of(tenantSettings("12.50")));
        List<InvoiceLineItem> rideLineItems = List.of(issuedRideLine(42L, "80.00", "1000.00"));
        when(invoiceLineItems.findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc(
                "tenant-1", ChargeSourceType.RIDE, 42L)).thenReturn(rideLineItems);
        DriverEarningsLedger pendingEntry = new DriverEarningsLedger();
        pendingEntry.setTenantId("tenant-1");
        pendingEntry.setDriverId(9L);
        pendingEntry.setRideId(42L);
        pendingEntry.setEntryType(DriverEarningsEntryType.EARNED);
        pendingEntry.setStatus(DriverEarningsStatus.PENDING_CALCULATION);
        when(ledger.findAllByTenantIdAndRideIdAndEntryType(
                "tenant-1",
                42L,
                DriverEarningsEntryType.EARNED)).thenReturn(List.of(pendingEntry));

        service.calculatePendingForIssuedRide("tenant-1", 42L);

        assertEquals(new BigDecimal("10.00"), pendingEntry.getAmount());
        assertEquals(DriverEarningsStatus.PENDING_REVIEW, pendingEntry.getStatus());
    }

    @Test
    void tenantAdminCanSetAmountSubmitForReviewAndApproveLedgerEntry() {
        when(currentUser.requireCurrentUser()).thenReturn(tenantAdmin());
        when(drivers.findByIdAndTenantId(9L, "tenant-1")).thenReturn(Optional.empty());
        when(rides.findByIdAndTenantId(42L, "tenant-1")).thenReturn(Optional.empty());
        DriverEarningsLedger entry = new DriverEarningsLedger();
        entry.setTenantId("tenant-1");
        entry.setDriverId(9L);
        entry.setRideId(42L);
        entry.setEntryType(DriverEarningsEntryType.EARNED);
        entry.setStatus(DriverEarningsStatus.PENDING_CALCULATION);
        entry.setCurrency("USD");
        entry.setSourceInvoiceId(7L); entry.setBillableAmount(new BigDecimal("100.00"));
        var originalLines=List.of(issuedRideLine(42L,"100.00","100.00"));
        when(invoiceLineItems.findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc("tenant-1",ChargeSourceType.RIDE,42L)).thenReturn(originalLines);
        when(ledger.findByIdAndTenantId(2L, "tenant-1")).thenReturn(Optional.of(entry));

        var submitted = service.updateEntry(
                2L, new DriverEarningsReviewRequest(new BigDecimal("25.50"), " Manually reviewed fare "));
        assertEquals(new BigDecimal("25.50"), submitted.amount());
        assertEquals("Manually reviewed fare", submitted.reason());
        assertEquals(DriverEarningsStatus.PENDING_REVIEW.name(), submitted.status());

        org.junit.jupiter.api.Assertions.assertThrows(com.transportplatform.tms.common.exception.ApiException.class, () -> service.approve(2L));
        when(rides.findByIdAndTenantId(42L, "tenant-1")).thenReturn(Optional.of(mock(com.transportplatform.tms.features.ride.domain.Ride.class)));
        var approved = service.approve(2L);
        assertEquals(DriverEarningsStatus.APPROVED.name(), approved.status());
        verify(ledger, times(2)).save(entry);
    }

    @Test
    void voidedInvoiceInvalidatesApprovedEarningsAndReplacementRequiresNewReview() {
        var entry=new DriverEarningsLedger();entry.setTenantId("tenant-1");entry.setRideId(42L);
        entry.setEntryType(DriverEarningsEntryType.EARNED);entry.setStatus(DriverEarningsStatus.APPROVED);
        entry.setSourceInvoiceId(7L);entry.setBillableAmount(new BigDecimal("100.00"));
        entry.setEarningsRate(new BigDecimal("20.00"));entry.setAmount(new BigDecimal("20.00"));entry.setCurrency("USD");
        when(ledger.findAllByTenantIdAndRideIdAndEntryType("tenant-1",42L,DriverEarningsEntryType.EARNED)).thenReturn(List.of(entry));
        when(settings.findById("tenant-1")).thenReturn(Optional.of(tenantSettings("20.00")));
        when(invoiceLineItems.findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc("tenant-1",ChargeSourceType.RIDE,42L)).thenReturn(List.of());
        service.reconcileRide("tenant-1",42L);
        assertEquals(DriverEarningsStatus.PENDING_CALCULATION,entry.getStatus());
        org.junit.jupiter.api.Assertions.assertNull(entry.getAmount());
        org.junit.jupiter.api.Assertions.assertNull(entry.getSourceInvoiceId());
        var correctedLines=List.of(issuedRideLine(42L,"150.00","150.00"));
        when(invoiceLineItems.findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc("tenant-1",ChargeSourceType.RIDE,42L)).thenReturn(correctedLines);
        service.reconcileRide("tenant-1",42L);
        assertEquals(DriverEarningsStatus.PENDING_REVIEW,entry.getStatus());
        assertEquals(new BigDecimal("30.00"),entry.getAmount());
    }

    private AuthenticatedUser tenantAdmin() {
        return new AuthenticatedUser(
                1L,
                "tenant-1",
                "admin",
                "Tenant",
                "Admin",
                "",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority(RoleName.ROLE_TENANT_ADMIN.name())));
    }

    private TenantSettings tenantSettings(String rate) {
        TenantSettings tenantSettings = new TenantSettings();
        tenantSettings.setTenantId("tenant-1");
        tenantSettings.setCurrency("USD");
        tenantSettings.setDriverEarningsRate(new BigDecimal(rate));
        return tenantSettings;
    }

    private InvoiceLineItem issuedRideLine(Long rideId, String lineAmount, String invoiceTotal) {
        Invoice invoice = mock(Invoice.class);
        when(invoice.getId()).thenReturn(7L);
        when(invoice.getStatus()).thenReturn(InvoiceStatus.ISSUED);
        when(invoice.getCurrency()).thenReturn("USD");
        when(invoice.getTotalAmount()).thenReturn(new BigDecimal(invoiceTotal));
        InvoiceLineItem lineItem = mock(InvoiceLineItem.class);
        when(lineItem.getInvoice()).thenReturn(invoice);
        when(lineItem.getSourceReferenceId()).thenReturn(rideId);
        when(lineItem.getChargeSourceType()).thenReturn(ChargeSourceType.RIDE);
        when(lineItem.getLineAmount()).thenReturn(new BigDecimal(lineAmount));
        return lineItem;
    }
}
