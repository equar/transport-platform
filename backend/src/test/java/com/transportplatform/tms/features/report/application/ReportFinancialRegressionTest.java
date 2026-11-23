package com.transportplatform.tms.features.report.application;

import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.report.domain.ReportType;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class ReportFinancialRegressionTest {
    @Test void draftAndVoidInvoicesDoNotInflateReceivablesAndAgingUsesTenantDate() {
        var access=mock(ReportAccessService.class);
        when(access.requireReport(ReportType.INVOICE)).thenReturn(new AuthenticatedUser(1L,"tenant-a","a@example.test","A","User","",true,true,false,List.of()));
        var repository=mock(InvoiceRepository.class);
        when(repository.findAll(org.mockito.ArgumentMatchers.<Specification<Invoice>>any(),any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(invoice(InvoiceStatus.DRAFT),invoice(InvoiceStatus.VOID),invoice(InvoiceStatus.ISSUED))));
        var service=new ReportService(access,mock(AuditLogService.class),null,null,null,null,null,repository,null,null,null,null,null,
            Clock.fixed(Instant.parse("2026-11-22T12:00:00Z"),ZoneOffset.UTC),mock(TenantSettingsRepository.class));
        var report=service.runInvoiceReport("",null,null,null,null,null);
        var values=new HashMap<String,String>(); report.summary().forEach(m -> values.put(m.key(),m.value()));
        assertEquals("100.00",values.get("totalBilled"));
        assertEquals("100.00",values.get("outstandingBalance"));
        assertEquals("100.00",values.get("aging1"));
        assertEquals(3,report.rows().size()); // History remains visible; totals distinguish accounting status.
    }
    private Invoice invoice(InvoiceStatus status) {
        var invoice=new Invoice();invoice.setStatus(status);invoice.setCurrency("USD");invoice.setTotalAmount(new BigDecimal("100.00"));
        invoice.setAmountPaid(BigDecimal.ZERO);invoice.setBalanceDue(new BigDecimal("100.00"));invoice.setDueDate(LocalDate.of(2026,11,1));return invoice;
    }
    @Test void rejectsUnsupportedCurrencyRatherThanRelabelingFinancialValues() {
        try(var validator=jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            for (Class<?> type : List.of(com.transportplatform.tms.features.billing.api.request.InvoiceUpsertRequest.class,
                com.transportplatform.tms.features.billing.api.request.PricingRuleUpsertRequest.class,
                com.transportplatform.tms.features.settings.api.request.CompanySettingsUpdateRequest.class)) {
                assertFalse(validator.getValidator().validateValue(type,"currency","EUR").isEmpty());
                assertFalse(validator.getValidator().validateValue(type,"currency","123").isEmpty());
                assertTrue(validator.getValidator().validateValue(type,"currency","USD").isEmpty());
            }
        }
    }
}
