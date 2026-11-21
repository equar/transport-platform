package com.transportplatform.tms.features.billing.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.billing.api.request.*;
import com.transportplatform.tms.features.billing.domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoiceRideIntegrityTest {
    @Mock InvoiceRepository invoices;
    @Mock InvoiceLineItemRepository lines;
    @Mock BillingAccessService access;
    @Mock BillingReferenceValidationService references;
    @Mock BillingCalculationService calculations;
    @Spy InvoiceFinancialService financial = new InvoiceFinancialService();
    @Spy InvoiceMapper mapper = new InvoiceMapper();
    @Mock InvoiceNumberGenerator numbers;
    @Mock com.transportplatform.tms.features.audit.application.AuditLogService audit;
    @Mock PaymentRepository payments;
    @Mock CollectionNoteRepository notes;
    @Mock com.transportplatform.tms.features.rider.domain.RiderRepository riders;
    @Mock com.transportplatform.tms.features.organization.domain.OrganizationRepository organizations;
    @Mock com.transportplatform.tms.features.organization.domain.ContractRepository contracts;
    @Mock com.transportplatform.tms.features.notification.application.NotificationEventService notifications;
    @Mock Clock clock;
    @Mock com.transportplatform.tms.features.settings.application.TenantTimeService time;
    @Mock com.transportplatform.tms.features.settings.domain.TenantSettingsRepository invoiceSettings;
    @Mock com.transportplatform.tms.features.driverearnings.application.DriverEarningsService driverEarningsService;
    @Mock InvoiceGenerationIdempotencyService invoiceGenerationIdempotencyService;
    @InjectMocks InvoiceService service;

    @org.junit.jupiter.api.BeforeEach void injectFieldDependencies() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "invoiceGenerationIdempotencyService", invoiceGenerationIdempotencyService);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "invoiceSettings", invoiceSettings);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "driverEarningsService", driverEarningsService);
    }

    @Test void duplicateRideIdsFailBeforePricingOrPersistence() {
        when(access.requireCompanyTenantId()).thenReturn("a");
        assertThatThrownBy(() -> service.previewManualGeneration(preview(List.of(8L, 8L), null)))
            .isInstanceOf(ApiException.class).hasMessageContaining("unique");
        verifyNoInteractions(calculations, invoices, lines);
    }

    @Test void duplicateManualRideLinesAreRejected() {
        when(access.requireCompanyTenantId()).thenReturn("a");
        when(references.resolveBillTo("a", BillToType.RIDER, 1L)).thenReturn(
            new BillingReferenceValidationService.ResolvedBillTo(BillToType.RIDER, 1L, "Test", null, null, null, null));
        assertThatThrownBy(() -> service.previewManualGeneration(preview(null, List.of(line(), line()))))
            .isInstanceOf(ApiException.class).hasMessageContaining("once");
        verify(invoices, never()).save(any());
    }

    @Test void addingOrEditingRideAlreadyClaimedByAnotherInvoiceFails() {
        Invoice draft = draft();
        when(access.requireCompanyTenantId()).thenReturn("a");
        when(time.today("a")).thenReturn(LocalDate.of(2026, 11, 20));
        when(access.findInvoiceForCompanyScope(1L)).thenReturn(draft);
        InvoiceLineItem claimed = mock(InvoiceLineItem.class);
        when(claimed.getInvoice()).thenReturn(draft());
        when(claimed.getId()).thenReturn(900L);
        when(lines.findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc("a", ChargeSourceType.RIDE, 8L))
            .thenReturn(List.of(claimed));
        assertThatThrownBy(() -> service.addLineItem(1L, line()))
            .isInstanceOf(ApiException.class).hasMessageContaining("already included");
        InvoiceLineItem edited = mapper.toLineItem(draft, line());
        when(access.findInvoiceLineItemForCompanyScope(2L)).thenReturn(edited);
        assertThatThrownBy(() -> service.updateLineItem(2L, line()))
            .isInstanceOf(ApiException.class).hasMessageContaining("already included");
        verify(lines, never()).save(any());
    }

    @Test void idempotentReplayReturnsOriginalWithoutGeneratingOrAuditingAgain() {
        var record = mock(InvoiceGenerationIdempotency.class);
        when(record.getInvoiceId()).thenReturn(14L);
        when(invoiceGenerationIdempotencyService.claim("retry", null))
            .thenReturn(new InvoiceGenerationIdempotencyService.Claim(record, false));
        when(access.findInvoiceForCompanyScope(14L)).thenReturn(draft());
        when(access.requireCompanyTenantId()).thenReturn("a");
        when(time.today("a")).thenReturn(LocalDate.of(2026, 11, 20));
        service.generateManualInvoice(null, "retry");
        verifyNoInteractions(numbers, audit, references);
        verify(invoices, never()).save(any());
        verify(lines, never()).save(any());
    }

    private Invoice draft() {
        var i = new Invoice(); i.setTenantId("a"); i.setStatus(InvoiceStatus.DRAFT);
        i.setBalanceDue(BigDecimal.TEN); i.setDueDate(LocalDate.of(2026, 12, 20));
        return i;
    }
    private InvoiceLineItemUpsertRequest line() {
        return new InvoiceLineItemUpsertRequest("Ride", ChargeSourceType.RIDE, 8L, null,
            BigDecimal.ONE, BigDecimal.TEN, null, null, null);
    }
    private BillingPreviewRequest preview(List<Long> rides, List<InvoiceLineItemUpsertRequest> items) {
        return new BillingPreviewRequest(BillToType.RIDER, 1L, null, null, rides, null, null,
            null, null, null, null, null, "USD", BigDecimal.ZERO, BigDecimal.ZERO, null, null, null, items);
    }
}
