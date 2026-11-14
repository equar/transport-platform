package com.transportplatform.tms.features.driverearnings.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItemRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsEntryType;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedger;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedgerRepository;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsStatus;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

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
            ledger, invoiceLineItems, settings, driverAccess, currentUser, drivers, rides, audit);

    @BeforeEach
    void returnSavedLedgerEntryFromRepository() {
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
        when(ledger.findAllByTenantIdAndRideIdAndStatusAndEntryType(
                "tenant-1",
                42L,
                DriverEarningsStatus.PENDING_CALCULATION,
                DriverEarningsEntryType.EARNED)).thenReturn(List.of(pendingEntry));

        service.calculatePendingForIssuedRide("tenant-1", 42L);

        assertEquals(new BigDecimal("10.00"), pendingEntry.getAmount());
        assertEquals(DriverEarningsStatus.PENDING_REVIEW, pendingEntry.getStatus());
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
