package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.api.request.PaymentPreviewRequest;
import com.transportplatform.tms.features.billing.api.request.PaymentUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.PaymentVoidRequest;
import com.transportplatform.tms.features.billing.api.response.PaymentDetailResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentPreviewResponse;
import com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillingAccessService billingAccessService;
    private final PaymentMapper paymentMapper;
    private final PaymentNumberGenerator paymentNumberGenerator;
    private final InvoiceFinancialService invoiceFinancialService;
    private final AuditLogService auditLogService;
    private final NotificationEventService notificationEventService;
    private final Clock clock;

    public PaymentService(PaymentRepository paymentRepository,
            BillingAccessService billingAccessService,
            PaymentMapper paymentMapper,
            PaymentNumberGenerator paymentNumberGenerator,
            InvoiceFinancialService invoiceFinancialService,
            AuditLogService auditLogService,
            NotificationEventService notificationEventService,
            Clock clock) {
        this.paymentRepository = paymentRepository;
        this.billingAccessService = billingAccessService;
        this.paymentMapper = paymentMapper;
        this.paymentNumberGenerator = paymentNumberGenerator;
        this.invoiceFinancialService = invoiceFinancialService;
        this.auditLogService = auditLogService;
        this.notificationEventService = notificationEventService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentSummaryResponse> searchCompanyPayments(String keyword,
            PaymentStatus status,
            PaymentMethod paymentMethod,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        LocalDate today = LocalDate.now(clock);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = paymentRepository.findAll(
                PaymentSpecifications.search(tenantId, keyword, status, paymentMethod, fromDate, toDate),
                pageable);
        return PageResponse.from(result.map(payment -> paymentMapper.toSummary(payment,
                InvoiceStatusWorkflow.resolveEffectiveStatus(payment.getInvoice(), today))));
    }

    @Transactional(readOnly = true)
    public PaymentDetailResponse getCompanyPayment(Long paymentId) {
        Payment payment = billingAccessService.findPaymentForCompanyScope(paymentId);
        return paymentMapper.toDetail(payment,
                InvoiceStatusWorkflow.resolveEffectiveStatus(payment.getInvoice(), LocalDate.now(clock)));
    }

    @Transactional(readOnly = true)
    public List<PaymentSummaryResponse> listCompanyInvoicePayments(Long invoiceId) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        LocalDate today = LocalDate.now(clock);
        return paymentRepository
                .findAllByInvoiceIdAndTenantIdOrderByPaymentDateDescCreatedAtDesc(invoice.getId(),
                        invoice.getTenantId())
                .stream()
                .map(payment -> paymentMapper.toSummary(payment,
                        InvoiceStatusWorkflow.resolveEffectiveStatus(payment.getInvoice(), today)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentPreviewResponse previewCompanyPayment(PaymentPreviewRequest request) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(request.invoiceId());
        validateInvoiceAcceptsPayment(invoice, request.amount(), LocalDate.now(clock));
        BigDecimal resultingBalance = invoiceFinancialService.previewResultingBalance(invoice, request.amount());
        return new PaymentPreviewResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getBillToNameSnapshot(),
                invoice.getBalanceDue(),
                request.amount().setScale(2, RoundingMode.HALF_UP),
                resultingBalance,
                invoiceFinancialService.previewResultingStatus(invoice, request.amount(), LocalDate.now(clock)));
    }

    @Transactional
    public PaymentDetailResponse createCompanyPayment(PaymentUpsertRequest request) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(request.invoiceId());
        validateInvoiceAcceptsPayment(invoice, request.amount(), LocalDate.now(clock));

        Payment payment = new Payment();
        payment.setTenantId(tenantId);
        payment.setInvoice(invoice);
        payment.setPaymentNumber(paymentNumberGenerator.generate(tenantId));
        paymentMapper.apply(payment, request);

        boolean applyImmediately = request.applyImmediately() == null || request.applyImmediately();
        Object oldInvoiceSnapshot = snapshot(invoice);
        if (applyImmediately) {
            BigDecimal resultingBalance = invoiceFinancialService.applyPayment(invoice, payment.getAmount(),
                    LocalDate.now(clock));
            payment.setStatus(paymentMapper.resolveAppliedStatus(resultingBalance));
        } else {
            payment.setStatus(PaymentStatus.RECORDED);
        }

        Payment saved = paymentRepository.save(payment);
        recordPaymentAudit(saved, "CREATED", "Payment " + saved.getPaymentNumber() + " was recorded.", null,
                snapshot(saved));
        if (applyImmediately) {
            recordInvoiceAudit(invoice, "PAYMENT_APPLIED",
                    "Payment " + saved.getPaymentNumber() + " was applied to invoice " + invoice.getInvoiceNumber()
                            + ".",
                    oldInvoiceSnapshot,
                    snapshot(invoice));
        }
        notificationEventService.publishPaymentRecorded(saved, applyImmediately);
        return paymentMapper.toDetail(saved,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, LocalDate.now(clock)));
    }

    @Transactional
    public PaymentDetailResponse updateCompanyPayment(Long paymentId, PaymentUpsertRequest request) {
        Payment payment = billingAccessService.findPaymentForCompanyScope(paymentId);
        PaymentStatusWorkflow.ensureCanUpdate(payment);
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(request.invoiceId());
        validateInvoiceAcceptsPayment(invoice, request.amount(), LocalDate.now(clock));
        Object oldSnapshot = snapshot(payment);
        payment.setInvoice(invoice);
        paymentMapper.apply(payment, request);
        Payment saved = paymentRepository.save(payment);
        recordPaymentAudit(saved, "UPDATED", "Payment " + saved.getPaymentNumber() + " was updated.", oldSnapshot,
                snapshot(saved));
        return paymentMapper.toDetail(saved,
                InvoiceStatusWorkflow.resolveEffectiveStatus(saved.getInvoice(), LocalDate.now(clock)));
    }

    @Transactional
    public PaymentDetailResponse applyCompanyPayment(Long paymentId) {
        Payment payment = billingAccessService.findPaymentForCompanyScope(paymentId);
        PaymentStatusWorkflow.ensureCanApply(payment);
        Invoice invoice = payment.getInvoice();
        validateInvoiceAcceptsPayment(invoice, payment.getAmount(), LocalDate.now(clock));
        Object oldPaymentSnapshot = snapshot(payment);
        Object oldInvoiceSnapshot = snapshot(invoice);
        BigDecimal resultingBalance = invoiceFinancialService.applyPayment(invoice, payment.getAmount(),
                LocalDate.now(clock));
        payment.setStatus(paymentMapper.resolveAppliedStatus(resultingBalance));
        Payment saved = paymentRepository.save(payment);
        recordPaymentAudit(saved, "APPLIED", "Payment " + saved.getPaymentNumber() + " was applied.",
                oldPaymentSnapshot, snapshot(saved));
        recordInvoiceAudit(invoice, "PAYMENT_APPLIED",
                "Payment " + saved.getPaymentNumber() + " was applied to invoice " + invoice.getInvoiceNumber() + ".",
                oldInvoiceSnapshot,
                snapshot(invoice));
        notificationEventService.publishPaymentApplied(saved);
        return paymentMapper.toDetail(saved,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, LocalDate.now(clock)));
    }

    @Transactional
    public PaymentDetailResponse voidCompanyPayment(Long paymentId, PaymentVoidRequest request) {
        Payment payment = billingAccessService.findPaymentForCompanyScope(paymentId);
        PaymentStatusWorkflow.ensureCanVoid(payment);
        Object oldPaymentSnapshot = snapshot(payment);
        Invoice invoice = payment.getInvoice();
        Object oldInvoiceSnapshot = snapshot(invoice);
        if (payment.getStatus() == PaymentStatus.APPLIED || payment.getStatus() == PaymentStatus.PARTIALLY_APPLIED) {
            invoiceFinancialService.reversePayment(invoice, payment.getAmount(), LocalDate.now(clock));
            recordInvoiceAudit(invoice, "PAYMENT_REVERSED",
                    "Payment " + payment.getPaymentNumber() + " was voided and reversed from invoice "
                            + invoice.getInvoiceNumber() + ".",
                    oldInvoiceSnapshot,
                    snapshot(invoice));
        }
        payment.setStatus(PaymentStatus.VOID);
        payment.setVoidReason(request.reason().trim());
        Payment saved = paymentRepository.save(payment);
        recordPaymentAudit(saved, "VOIDED", "Payment " + saved.getPaymentNumber() + " was voided.",
                oldPaymentSnapshot,
                snapshot(saved));
        return paymentMapper.toDetail(saved,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, LocalDate.now(clock)));
    }

    public long countTotalPayments(String tenantId) {
        return paymentRepository.countByTenantId(tenantId);
    }

    public BigDecimal calculateCollectedAmount(String tenantId) {
        return paymentRepository.findAll(PaymentSpecifications.search(tenantId, "", null, null, null, null))
                .stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.VOID
                        && payment.getStatus() != PaymentStatus.FAILED)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void validateInvoiceAcceptsPayment(Invoice invoice, BigDecimal amount, LocalDate today) {
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw validationFailure("Draft invoices cannot accept payments.");
        }
        if (invoice.getStatus() == InvoiceStatus.VOID) {
            throw validationFailure("Void invoices cannot accept payments.");
        }
        if (InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, today) == InvoiceStatus.PAID
                || invoice.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            throw validationFailure("This invoice does not have an outstanding balance available for payment.");
        }
        if (amount.setScale(2, RoundingMode.HALF_UP).compareTo(invoice.getBalanceDue()) > 0) {
            throw validationFailure("Payment amount cannot exceed the current outstanding invoice balance.");
        }
        if (invoice.getInvoiceDate() != null && invoice.getInvoiceDate().isAfter(LocalDate.now(clock).plusYears(5))) {
            throw validationFailure("Invoice context is invalid for payment recording.");
        }
    }

    private void recordPaymentAudit(Payment payment, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                payment.getTenantId(),
                "PAYMENT",
                action,
                "PAYMENT",
                payment.getId() == null ? payment.getPaymentNumber() : payment.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private void recordInvoiceAudit(Invoice invoice, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                invoice.getTenantId(),
                "INVOICE",
                action,
                "INVOICE",
                invoice.getId() == null ? invoice.getInvoiceNumber() : invoice.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshot(Payment payment) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", payment.getId());
        values.put("paymentNumber", payment.getPaymentNumber());
        values.put("invoiceId", payment.getInvoice() == null ? null : payment.getInvoice().getId());
        values.put("invoiceNumber", payment.getInvoice() == null ? null : payment.getInvoice().getInvoiceNumber());
        values.put("paymentDate", payment.getPaymentDate());
        values.put("amount", payment.getAmount());
        values.put("paymentMethod", payment.getPaymentMethod() == null ? null : payment.getPaymentMethod().name());
        values.put("referenceNumber", payment.getReferenceNumber());
        values.put("payerName", payment.getPayerName());
        values.put("status", payment.getStatus() == null ? null : payment.getStatus().name());
        values.put("voidReason", payment.getVoidReason());
        return values;
    }

    private Object snapshot(Invoice invoice) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", invoice.getId());
        values.put("invoiceNumber", invoice.getInvoiceNumber());
        values.put("amountPaid", invoice.getAmountPaid());
        values.put("balanceDue", invoice.getBalanceDue());
        values.put("status", invoice.getStatus() == null ? null : invoice.getStatus().name());
        return values;
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "paymentNumber", "paymentDate", "amount", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}