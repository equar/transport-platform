package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.concurrency.WorkflowLockService;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.api.request.InvoiceLineItemUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.InvoiceUpsertRequest;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import com.transportplatform.tms.features.saas.application.TenantModulePolicy;
import com.transportplatform.tms.features.settings.application.TenantTimeService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Called only by the tenant-scoped route workflow, inside its dispatch transaction. */
@Service
public class RouteInvoiceService {
    @org.springframework.beans.factory.annotation.Autowired private InvoicePolicyService policy;
    @org.springframework.beans.factory.annotation.Autowired private BillingSourceService sources;
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate db;
    private final BillingReferenceValidationService references;
    private final InvoiceRepository invoices;
    private final InvoiceLineItemRepository lines;
    private final InvoiceMapper mapper;
    private final InvoiceFinancialService financials;
    private final InvoiceNumberGenerator numbers;
    private final TenantTimeService time;
    private final TenantModulePolicy modules;
    private final WorkflowLockService locks;
    private final AuditLogService audit;

    public RouteInvoiceService(BillingReferenceValidationService references, InvoiceRepository invoices,
            InvoiceLineItemRepository lines, InvoiceMapper mapper, InvoiceFinancialService financials,
            InvoiceNumberGenerator numbers, TenantTimeService time, TenantModulePolicy modules,
            WorkflowLockService locks, AuditLogService audit) {
        this.references = references; this.invoices = invoices; this.lines = lines; this.mapper = mapper;
        this.financials = financials; this.numbers = numbers; this.time = time; this.modules = modules;
        this.locks = locks; this.audit = audit;
    }

    public void validateBilling(Route route) {
        if (route.getBillToType() == null ^ route.getBillToId() == null) {
            throw invalid("Select both a billing account type and a billing account.");
        }
        if (route.getApplicablePrice() != null && route.getBillToId() == null) {
            throw invalid("Select a billing account for this priced route, or clear its price for manual invoicing.");
        }
        if (route.getBillToId() != null) {
            modules.requireEnabled(route.getTenantId(), "BILLING");
            references.resolveBillTo(route.getTenantId(), route.getBillToType(), route.getBillToId());
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void createDraftOnCompletion(Route route) {
        if (route.getStatus() != RouteStatus.COMPLETED) throw invalid("Complete the route before generating its invoice.");
        if (route.getAutoInvoiceId() != null || route.getApplicablePrice() == null) return;
        locks.lock(route.getTenantId(), "FINANCE", 0);
        if (db.queryForObject("SELECT COUNT(DISTINCT r.id) FROM route_stops s JOIN rides r ON r.tenant_id=s.tenant_id AND r.id=s.ride_id WHERE s.tenant_id=? AND s.route_id=? AND r.status='COMPLETED'", Long.class, route.getTenantId(), route.getId()) == 0) return;
        validateBilling(route);
        locks.lock(route.getTenantId(), "FINANCE", 0);
        var billTo = references.resolveBillTo(route.getTenantId(), route.getBillToType(), route.getBillToId());
        var today = time.today(route.getTenantId());
        Invoice invoice = new Invoice();
        invoice.setTenantId(route.getTenantId());
        invoice.setInvoiceNumber(numbers.generate(route.getTenantId()));
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setAmountPaid(BigDecimal.ZERO);
        mapper.apply(invoice, new InvoiceUpsertRequest(route.getBillToType(), route.getBillToId(),
                route.getRouteDate(), route.getRouteDate(), today, today.plusDays(policy.settings(route.getTenantId()).getDefaultInvoiceDueDays()),
                BigDecimal.ZERO, BigDecimal.ZERO, "USD", "Automatically generated for route " + route.getRouteCode() + "."), billTo);
        String journey = route.getBillingTripType() == com.transportplatform.tms.features.ride.domain.RideTripType.ROUND_TRIP
                ? "Round trip" : "One way";
        var line = mapper.toLineItem(invoice, new InvoiceLineItemUpsertRequest(
                "Route " + route.getRouteCode() + " · " + journey + " (entire route)", ChargeSourceType.ROUTE,
                route.getId(), null, BigDecimal.ONE, route.getApplicablePrice(), route.getRouteDate(), journey, null));
        line.setLineNumber(1);
        policy.apply(invoice, List.of(line), true);
        financials.recalculateTotals(invoice, List.of(line), today);
        sources.validate(invoice, List.of(line));
        Invoice saved = invoices.save(invoice);
        lines.saveAndFlush(line);
        sources.sync(saved, List.of(line));
        route.setAutoInvoiceId(saved.getId());
        audit.record(new AuditLogCommand(null, route.getTenantId(), "BILLING", "CREATED", "INVOICE",
                saved.getId().toString(), "Draft invoice " + saved.getInvoiceNumber() + " created for route "
                        + route.getRouteCode() + ".", null,
                java.util.Map.of("routeId", route.getId(), "amount", route.getApplicablePrice(), "currency", "USD")));
    }

    private ApiException invalid(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}
