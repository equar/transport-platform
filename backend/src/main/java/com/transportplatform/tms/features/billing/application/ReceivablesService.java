package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.api.request.CollectionNoteUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.AgingBucketSummaryResponse;
import com.transportplatform.tms.features.billing.api.response.CollectionNoteResponse;
import com.transportplatform.tms.features.billing.api.response.ReceivablesSummaryResponse;
import com.transportplatform.tms.features.billing.domain.CollectionNote;
import com.transportplatform.tms.features.billing.domain.CollectionNoteRepository;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReceivablesService {

    private final BillingAccessService billingAccessService;
    private final CollectionNoteRepository collectionNoteRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceFinancialService invoiceFinancialService;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public ReceivablesService(BillingAccessService billingAccessService,
            CollectionNoteRepository collectionNoteRepository,
            PaymentRepository paymentRepository,
            InvoiceFinancialService invoiceFinancialService,
            AuditLogService auditLogService,
            Clock clock) {
        this.billingAccessService = billingAccessService;
        this.collectionNoteRepository = collectionNoteRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceFinancialService = invoiceFinancialService;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ReceivablesSummaryResponse getCompanyReceivablesSummary() {
        return getReceivablesSummary(billingAccessService.requireCompanyTenantId());
    }

    @Transactional(readOnly = true)
    public ReceivablesSummaryResponse getReceivablesSummary(String tenantId) {
        LocalDate today = LocalDate.now(clock);
        List<Invoice> invoices = billingAccessService.findAllInvoicesForTenant(tenantId);
        List<Invoice> openReceivables = invoices.stream()
                .filter(invoiceFinancialService::isReceivable)
                .toList();

        BigDecimal overdueAmount = openReceivables.stream()
                .filter(invoice -> invoiceFinancialService.resolveDaysPastDue(invoice, today) > 0)
                .map(Invoice::getBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        long overdueInvoiceCount = openReceivables.stream()
                .filter(invoice -> invoiceFinancialService.resolveDaysPastDue(invoice, today) > 0)
                .count();

        long partiallyPaidInvoiceCount = invoices.stream()
                .filter(invoice -> invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID)
                .count();

        Map<InvoiceAgingBucket, AgingAccumulator> buckets = new LinkedHashMap<>();
        Arrays.stream(InvoiceAgingBucket.values()).forEach(bucket -> buckets.put(bucket, new AgingAccumulator()));
        for (Invoice invoice : openReceivables) {
            InvoiceAgingBucket bucket = invoiceFinancialService.resolveAgingBucket(invoice, today);
            if (bucket != null) {
                buckets.get(bucket).add(invoice.getBalanceDue());
            }
        }

        BigDecimal outstandingBalance = openReceivables.stream()
                .map(Invoice::getBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCollectedAmount = paymentRepository
                .findAll(PaymentSpecifications.search(tenantId, "", null, null, null, null))
                .stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.VOID
                        && payment.getStatus() != PaymentStatus.FAILED)
                .map(payment -> payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new ReceivablesSummaryResponse(
                paymentRepository.countByTenantId(tenantId),
                totalCollectedAmount,
                outstandingBalance,
                overdueInvoiceCount,
                overdueAmount,
                partiallyPaidInvoiceCount,
                buckets.entrySet().stream()
                        .map(entry -> new AgingBucketSummaryResponse(
                                entry.getKey(),
                                entry.getValue().count(),
                                entry.getValue().amount()))
                        .toList());
    }

    @Transactional(readOnly = true)
    public List<CollectionNoteResponse> listCompanyInvoiceCollectionNotes(Long invoiceId) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        return collectionNoteRepository
                .findAllByInvoiceIdAndTenantIdOrderByCreatedAtDesc(invoice.getId(), invoice.getTenantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CollectionNoteResponse addCollectionNote(Long invoiceId, CollectionNoteUpsertRequest request) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        if (!invoiceFinancialService.isReceivable(invoice)) {
            throw validationFailure(
                    "Collection notes are only available for invoices with an outstanding receivable balance.");
        }
        CollectionNote note = new CollectionNote();
        note.setTenantId(invoice.getTenantId());
        note.setInvoice(invoice);
        note.setContactMethod(request.contactMethod());
        note.setNote(request.note().trim());
        note.setNextFollowUpDate(request.nextFollowUpDate());
        CollectionNote saved = collectionNoteRepository.save(note);
        auditLogService.record(new AuditLogCommand(
                null,
                invoice.getTenantId(),
                "RECEIVABLES",
                "COLLECTION_NOTE_ADDED",
                "INVOICE",
                invoice.getId().toString(),
                "A collection note was added to invoice " + invoice.getInvoiceNumber() + ".",
                null,
                snapshot(saved)));
        return toResponse(saved);
    }

    private CollectionNoteResponse toResponse(CollectionNote note) {
        return new CollectionNoteResponse(
                note.getId(),
                note.getInvoice().getId(),
                note.getContactMethod(),
                note.getNote(),
                note.getNextFollowUpDate(),
                note.getCreatedBy(),
                note.getCreatedAt(),
                note.getUpdatedBy(),
                note.getUpdatedAt());
    }

    private Object snapshot(CollectionNote note) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", note.getId());
        values.put("invoiceId", note.getInvoice().getId());
        values.put("contactMethod", note.getContactMethod() == null ? null : note.getContactMethod().name());
        values.put("note", note.getNote());
        values.put("nextFollowUpDate", note.getNextFollowUpDate());
        return values;
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private static final class AgingAccumulator {
        private long count;
        private BigDecimal amount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        void add(BigDecimal value) {
            count++;
            amount = amount.add(value).setScale(2, RoundingMode.HALF_UP);
        }

        long count() {
            return count;
        }

        BigDecimal amount() {
            return amount;
        }
    }
}