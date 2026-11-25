package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.concurrency.WorkflowLockService;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.route.domain.*;
import com.transportplatform.tms.features.saas.application.TenantModulePolicy;
import com.transportplatform.tms.features.settings.application.TenantTimeService;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class RouteInvoiceServiceTest {
    private final BillingReferenceValidationService references = mock(BillingReferenceValidationService.class);
    private final InvoiceRepository invoices = mock(InvoiceRepository.class);
    private final InvoiceLineItemRepository lines = mock(InvoiceLineItemRepository.class);
    private final InvoiceNumberGenerator numbers = mock(InvoiceNumberGenerator.class);
    private final TenantTimeService time = mock(TenantTimeService.class);
    private final TenantModulePolicy modules = mock(TenantModulePolicy.class);
    private final WorkflowLockService locks = mock(WorkflowLockService.class);
    private final AuditLogService audit = mock(AuditLogService.class);
    private final RouteInvoiceService service = new RouteInvoiceService(references, invoices, lines,
            new InvoiceMapper(), new InvoiceFinancialService(), numbers, time, modules, locks, audit);
    private Route route;

    @BeforeEach
    void setup() {
        var db = mock(org.springframework.jdbc.core.JdbcTemplate.class);
        when(db.queryForObject(anyString(), eq(Long.class), any(Object[].class))).thenReturn(1L);
        ReflectionTestUtils.setField(service, "db", db);
        ReflectionTestUtils.setField(service, "sources", mock(BillingSourceService.class));
        ReflectionTestUtils.setField(service, "policy", new InvoicePolicyService(mock(com.transportplatform.tms.features.settings.domain.TenantSettingsRepository.class)));

        route = new Route(); ReflectionTestUtils.setField(route, "id", 15L);
        route.setTenantId("tenant-a"); route.setRouteCode("ROUTE-15");
        route.setRouteDate(LocalDate.of(2026, 11, 23)); route.setStatus(RouteStatus.COMPLETED);
        route.setPrice(new BigDecimal("125.00")); route.setRoundTripPrice(new BigDecimal("200.00"));
        route.setBillingTripType(RideTripType.ONE_WAY); route.setBillToType(BillToType.ORGANIZATION); route.setBillToId(9L);
        when(references.resolveBillTo("tenant-a", BillToType.ORGANIZATION, 9L)).thenReturn(
                new BillingReferenceValidationService.ResolvedBillTo(BillToType.ORGANIZATION, 9L, "School", null, null, 9L, null));
        when(numbers.generate("tenant-a")).thenReturn("INV-15");
        when(time.today("tenant-a")).thenReturn(LocalDate.of(2026, 11, 24));
        when(invoices.save(any())).thenAnswer(invocation -> {
            Invoice invoice = invocation.getArgument(0); ReflectionTestUtils.setField(invoice, "id", 30L); return invoice;
        });
    }

    @Test
    void createsOneDraftForEntireRouteAndRetryDoesNotDuplicateIt() {
        service.createDraftOnCompletion(route);
        service.createDraftOnCompletion(route);
        var saved = ArgumentCaptor.forClass(Invoice.class);
        verify(invoices, times(1)).save(saved.capture());
        assertEquals(InvoiceStatus.DRAFT, saved.getValue().getStatus());
        assertEquals("tenant-a", saved.getValue().getTenantId());
        assertEquals("USD", saved.getValue().getCurrency());
        assertEquals(9L, saved.getValue().getBillToId());
        assertEquals(new BigDecimal("125.00"), saved.getValue().getTotalAmount());
        assertEquals(LocalDate.of(2026, 12, 24), saved.getValue().getDueDate());
        assertEquals(30L, route.getAutoInvoiceId());
        var line = ArgumentCaptor.forClass(InvoiceLineItem.class);
        verify(lines).saveAndFlush(line.capture());
        assertEquals(BigDecimal.ONE, line.getValue().getQuantity());
        assertEquals(ChargeSourceType.ROUTE, line.getValue().getChargeSourceType());
        assertEquals(15L, line.getValue().getSourceReferenceId());
        verify(audit).record(any());
    }

    @Test
    void usesRoundTripPriceOnceRatherThanMultiplyingByRidersOrLegs() {
        route.setBillingTripType(RideTripType.ROUND_TRIP);
        service.createDraftOnCompletion(route);
        var saved = ArgumentCaptor.forClass(Invoice.class); verify(invoices).save(saved.capture());
        assertEquals(new BigDecimal("200.00"), saved.getValue().getTotalAmount());
    }

    @Test
    void unpricedAndLegacyRoutesStayManual() {
        route.setPrice(null); service.createDraftOnCompletion(route);
        route.setPrice(new BigDecimal("125.00")); route.setBillingTripType(null);
        service.createDraftOnCompletion(route);
        verifyNoInteractions(invoices, lines, locks);
    }

    @Test
    void refusesMissingPayerOrPayerFromAnotherTenant() {
        route.setBillToId(null); route.setBillToType(null);
        assertThrows(ApiException.class, () -> service.validateBilling(route));
        route.setBillToId(9L); route.setBillToType(BillToType.ORGANIZATION);
        doThrow(new ApiException(com.transportplatform.tms.common.exception.ErrorCode.RESOURCE_NOT_FOUND,
                org.springframework.http.HttpStatus.NOT_FOUND, "Organization was not found.")).when(references)
                .resolveBillTo("tenant-a", BillToType.ORGANIZATION, 9L);
        assertThrows(ApiException.class, () -> service.createDraftOnCompletion(route));
        verifyNoInteractions(invoices, lines);
    }

    @Test
    void doesNotGenerateBeforeCompletionOrWithoutBillingModule() {
        route.setStatus(RouteStatus.IN_PROGRESS);
        assertThrows(ApiException.class, () -> service.createDraftOnCompletion(route));
        route.setStatus(RouteStatus.COMPLETED);
        doThrow(new ApiException(com.transportplatform.tms.common.exception.ErrorCode.FORBIDDEN,
                org.springframework.http.HttpStatus.FORBIDDEN, "Billing disabled")).when(modules).requireEnabled("tenant-a", "BILLING");
        assertThrows(ApiException.class, () -> service.createDraftOnCompletion(route));
        verifyNoInteractions(invoices, lines);
    }
    @Test void noCompletedTripMeansNoAutomaticCharge() {
        var db = (org.springframework.jdbc.core.JdbcTemplate)ReflectionTestUtils.getField(service,"db");
        when(db.queryForObject(anyString(),eq(Long.class),any(Object[].class))).thenReturn(0L);
        service.createDraftOnCompletion(route);
        verifyNoInteractions(invoices,lines);
    }
    @Test void automaticInvoiceUsesConfiguredTaxAndDueDays() {
        var settings=com.transportplatform.tms.features.settings.application.CompanySettingsService.defaultSettings("tenant-a");
        settings.setTaxEnabled(true);settings.setDefaultTaxRate(new BigDecimal("10.00"));settings.setDefaultInvoiceDueDays(14);
        var repository=mock(com.transportplatform.tms.features.settings.domain.TenantSettingsRepository.class);
        when(repository.findById("tenant-a")).thenReturn(java.util.Optional.of(settings));
        ReflectionTestUtils.setField(service,"policy",new InvoicePolicyService(repository));
        service.createDraftOnCompletion(route);
        var saved=ArgumentCaptor.forClass(Invoice.class);verify(invoices).save(saved.capture());
        assertEquals(new BigDecimal("137.50"),saved.getValue().getTotalAmount());
        assertEquals(LocalDate.of(2026,12,8),saved.getValue().getDueDate());
    }
}
