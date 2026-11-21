package com.transportplatform.tms.features.billing.application;

import static com.transportplatform.tms.features.billing.api.adjustment.BillingAdjustmentRecords.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.privacy.PhiCipher;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.settings.application.TenantTimeService;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.security.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.function.*;

/**
 * Immutable manual cash-refund records and separately issued credit vouchers; never calls a bank.
 */
@Service
public class BillingAdjustmentService {
    private final JdbcTemplate db;
    private final BillingAccessService access;
    private final PaymentRepository payments;
    private final InvoiceFinancialService financial;
    private final PaymentNumberGenerator numbers;
    private final TenantTimeService time;
    private final CurrentAuthenticatedUserService users;
    private final AuditLogService audit;
    private final PhiCipher privacy;
    private final ObjectMapper json;

    public BillingAdjustmentService(
            JdbcTemplate db,
            BillingAccessService access,
            PaymentRepository payments,
            InvoiceFinancialService financial,
            PaymentNumberGenerator numbers,
            TenantTimeService time,
            CurrentAuthenticatedUserService users,
            AuditLogService audit,
            PhiCipher privacy,
            ObjectMapper json) {
        this.db = db;
        this.access = access;
        this.payments = payments;
        this.financial = financial;
        this.numbers = numbers;
        this.time = time;
        this.users = users;
        this.audit = audit;
        this.privacy = privacy;
        this.json = json;
    }

    @Transactional
    public Refund refund(long paymentId, RefundRequest request, String key) {
        return intent(
                key,
                "REFUND",
                List.of(paymentId, request),
                () -> {
                    String tenant = requireBillingTenant();
                    Payment p = access.findPaymentForCompanyScope(paymentId);
                    if (p.getPaymentMethod() == PaymentMethod.CREDIT_NOTE
                            || !Set.of(
                                            PaymentStatus.APPLIED,
                                            PaymentStatus.PARTIALLY_APPLIED,
                                            PaymentStatus.PARTIALLY_REFUNDED)
                                    .contains(p.getStatus()))
                        throw conflict("Only applied cash payments can be refunded.");
                    BigDecimal remaining = p.getAmount().subtract(p.getRefundedAmount());
                    if (request.amount().compareTo(remaining) > 0)
                        throw conflict(
                                "The refund exceeds the payment's remaining refundable amount.");
                    if (!db.queryForList(
                                    "SELECT id FROM payment_refunds WHERE tenant_id=? AND"
                                            + " external_reference=?",
                                    Long.class,
                                    tenant,
                                    request.reference().trim())
                            .isEmpty())
                        throw conflict("This refund reference has already been recorded.");
                    Invoice invoice = p.getInvoice();
                    financial.reversePayment(invoice, request.amount(), time.today(tenant));
                    p.setRefundedAmount(p.getRefundedAmount().add(request.amount()));
                    p.setStatus(
                            p.getRefundedAmount().compareTo(p.getAmount()) == 0
                                    ? PaymentStatus.REFUNDED
                                    : PaymentStatus.PARTIALLY_REFUNDED);
                    payments.save(p);
                    long id =
                            insert(
                                    "INSERT INTO"
                                        + " payment_refunds(tenant_id,payment_id,invoice_id,amount,currency,external_reference,reason,created_by)"
                                        + " VALUES(?,?,?,?,?,?,?,?)",
                                    tenant,
                                    paymentId,
                                    invoice.getId(),
                                    request.amount(),
                                    invoice.getCurrency(),
                                    request.reference().trim(),
                                    privacy.encrypt(request.reason().trim(), "text"),
                                    users.requireCurrentUser().id());
                    record(tenant, "REFUND_RECORDED", "PAYMENT_REFUND", id, request.amount());
                    return id;
                },
                this::refundById);
    }

    @Transactional
    public CreditNote createCredit(long invoiceId, CreditRequest request, String key) {
        return intent(
                key,
                "CREDIT_ISSUED",
                List.of(invoiceId, request),
                () -> {
                    Invoice source = access.findInvoiceForCompanyScope(invoiceId);
                    ensureIssued(source);
                    BigDecimal issued =
                            db.queryForObject(
                                    "SELECT COALESCE(SUM(amount),0) FROM credit_notes WHERE"
                                            + " tenant_id=? AND source_invoice_id=? AND"
                                            + " status='ISSUED'",
                                    BigDecimal.class,
                                    source.getTenantId(),
                                    invoiceId);
                    if (issued.add(request.amount()).compareTo(source.getTotalAmount()) > 0)
                        throw conflict("Credits cannot exceed the source invoice's face amount.");
                    long id =
                            insert(
                                    "INSERT INTO"
                                        + " credit_notes(tenant_id,source_invoice_id,credit_number,bill_to_type,bill_to_id,amount,currency,status,reason,created_by)"
                                        + " VALUES(?,?,?,?,?,?,?,'ISSUED',?,?)",
                                    source.getTenantId(),
                                    invoiceId,
                                    "CN-"
                                            + UUID.randomUUID()
                                                    .toString()
                                                    .substring(0, 12)
                                                    .toUpperCase(Locale.ROOT),
                                    source.getBillToType().name(),
                                    source.getBillToId(),
                                    request.amount(),
                                    source.getCurrency(),
                                    privacy.encrypt(request.reason().trim(), "text"),
                                    users.requireCurrentUser().id());
                    record(
                            source.getTenantId(),
                            "CREDIT_ISSUED",
                            "CREDIT_NOTE",
                            id,
                            request.amount());
                    return id;
                },
                this::creditById);
    }

    @Transactional
    public CreditApplication applyCredit(long noteId, ApplyCreditRequest request, String key) {
        return intent(
                key,
                "CREDIT_APPLIED",
                List.of(noteId, request),
                () -> {
                    String tenant = requireBillingTenant();
                    var note = creditRow(noteId, tenant);
                    var view = creditById(noteId);
                    if (!view.status().equals("ISSUED")
                            || request.amount().compareTo(view.availableAmount()) > 0)
                        throw conflict(
                                "The credit is void or does not have enough remaining balance.");
                    Invoice target = access.findInvoiceForCompanyScope(request.invoiceId());
                    ensureIssued(target);
                    if (target.getId().equals(view.sourceInvoiceId()))
                        throw conflict(
                                "This credit is for a future invoice; it does not reduce the source"
                                        + " invoice.");
                    if (!target.getCurrency().equals(view.currency())
                            || !target.getBillToType().name().equals(note.get("bill_to_type"))
                            || target.getBillToId().longValue()
                                    != ((Number) note.get("bill_to_id")).longValue())
                        throw conflict(
                                "Credit must be applied to the same bill-to account and currency.");
                    if (request.amount().compareTo(target.getBalanceDue()) > 0)
                        throw conflict("Credit exceeds the invoice's outstanding balance.");
                    var remaining =
                            financial.applyPayment(target, request.amount(), time.today(tenant));
                    Payment payment = new Payment();
                    payment.setTenantId(tenant);
                    payment.setInvoice(target);
                    payment.setPaymentNumber(numbers.generate(tenant));
                    payment.setPaymentDate(time.today(tenant));
                    payment.setAmount(request.amount());
                    payment.setPaymentMethod(PaymentMethod.CREDIT_NOTE);
                    payment.setSourceCreditNoteId(noteId);
                    payment.setReferenceNumber(view.number());
                    payment.setStatus(
                            remaining.signum() == 0
                                    ? PaymentStatus.APPLIED
                                    : PaymentStatus.PARTIALLY_APPLIED);
                    payment = payments.saveAndFlush(payment);
                    long id =
                            insert(
                                    "INSERT INTO"
                                        + " credit_applications(tenant_id,credit_note_id,invoice_id,payment_id,amount,currency,created_by)"
                                        + " VALUES(?,?,?,?,?,?,?)",
                                    tenant,
                                    noteId,
                                    target.getId(),
                                    payment.getId(),
                                    request.amount(),
                                    target.getCurrency(),
                                    users.requireCurrentUser().id());
                    record(tenant, "CREDIT_APPLIED", "CREDIT_APPLICATION", id, request.amount());
                    return id;
                },
                this::applicationById);
    }

    @Transactional
    public CreditNote voidCredit(long id, VoidCreditRequest request, String key) {
        return intent(
                key,
                "CREDIT_VOIDED",
                List.of(id, request),
                () -> {
                    var note = creditById(id);
                    if (!note.status().equals("ISSUED") || note.usedAmount().signum() != 0)
                        throw conflict(
                                "Only an unused issued credit note can be voided. Reverse its"
                                        + " credit payments first.");
                    db.update(
                            "UPDATE credit_notes SET status='VOID',void_reason=? WHERE id=? AND"
                                    + " tenant_id=?",
                            privacy.encrypt(request.reason().trim(), "text"),
                            id,
                            requireBillingTenant());
                    record(
                            requireBillingTenant(),
                            "CREDIT_VOIDED",
                            "CREDIT_NOTE",
                            id,
                            note.amount());
                    return id;
                },
                this::creditById);
    }

    @Transactional(readOnly = true)
    public List<Refund> refunds(long paymentId) {
        String tenant = requireBillingTenant();
        access.findPaymentForCompanyScope(paymentId);
        return db
                .queryForList(
                        "SELECT * FROM payment_refunds WHERE tenant_id=? AND payment_id=? ORDER BY"
                                + " id",
                        tenant,
                        paymentId)
                .stream()
                .map(this::mapRefund)
                .toList();
    }

    private static final String CREDIT_BALANCE_SQL =
            "SELECT n.*,COALESCE(u.used_amount,0) AS used_amount FROM credit_notes n LEFT JOIN"
                    + " (SELECT a.tenant_id,a.credit_note_id,SUM(a.amount) AS used_amount FROM"
                    + " credit_applications a JOIN payments p ON p.id=a.payment_id AND"
                    + " p.tenant_id=a.tenant_id WHERE a.tenant_id=? AND p.status IN"
                    + " ('APPLIED','PARTIALLY_APPLIED') GROUP BY a.tenant_id,a.credit_note_id) u ON"
                    + " u.tenant_id=n.tenant_id AND u.credit_note_id=n.id WHERE n.tenant_id=?";

    @Transactional(readOnly = true)
    public List<CreditNote> credits(long invoiceId, boolean available) {
        String tenant = requireBillingTenant();
        Invoice invoice = access.findInvoiceForCompanyScope(invoiceId);
        var rows =
                available
                        ? db.queryForList(
                                CREDIT_BALANCE_SQL
                                        + " AND n.bill_to_type=? AND n.bill_to_id=? AND"
                                        + " n.currency=? AND n.status='ISSUED' AND"
                                        + " n.source_invoice_id<>? ORDER BY n.id",
                                tenant,
                                tenant,
                                invoice.getBillToType().name(),
                                invoice.getBillToId(),
                                invoice.getCurrency(),
                                invoiceId)
                        : db.queryForList(
                                CREDIT_BALANCE_SQL + " AND n.source_invoice_id=? ORDER BY n.id",
                                tenant,
                                tenant,
                                invoiceId);
        return rows.stream()
                .map(this::mapCredit)
                .filter(n -> !available || n.availableAmount().signum() > 0)
                .toList();
    }

    private Map<String, Object> creditRow(long id, String tenant) {
        return row("credit_notes", id, tenant);
    }

    private CreditNote creditById(long id) {
        String tenant = requireBillingTenant();
        var rows = db.queryForList(CREDIT_BALANCE_SQL + " AND n.id=?", tenant, tenant, id);
        if (rows.isEmpty())
            throw new ApiException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    HttpStatus.NOT_FOUND,
                    "Credit note was not found.");
        return mapCredit(rows.getFirst());
    }

    private CreditNote mapCredit(Map<String, Object> n) {
        BigDecimal used = (BigDecimal) n.get("used_amount"), amount = (BigDecimal) n.get("amount");
        String status = (String) n.get("status");
        return new CreditNote(
                ((Number) n.get("id")).longValue(),
                ((Number) n.get("source_invoice_id")).longValue(),
                (String) n.get("credit_number"),
                amount,
                used,
                status.equals("ISSUED") ? amount.subtract(used) : BigDecimal.ZERO,
                (String) n.get("currency"),
                status,
                privacy.decrypt((String) n.get("reason"), "text"),
                instant(n.get("created_at")));
    }

    private Refund refundById(long id) {
        return mapRefund(row("payment_refunds", id, requireBillingTenant()));
    }

    private Refund mapRefund(Map<String, Object> n) {
        return new Refund(
                ((Number) n.get("id")).longValue(),
                ((Number) n.get("payment_id")).longValue(),
                ((Number) n.get("invoice_id")).longValue(),
                (BigDecimal) n.get("amount"),
                (String) n.get("currency"),
                (String) n.get("external_reference"),
                privacy.decrypt((String) n.get("reason"), "text"),
                instant(n.get("created_at")));
    }

    private CreditApplication applicationById(long id) {
        var n = row("credit_applications", id, requireBillingTenant());
        return new CreditApplication(
                id,
                ((Number) n.get("credit_note_id")).longValue(),
                ((Number) n.get("invoice_id")).longValue(),
                ((Number) n.get("payment_id")).longValue(),
                (BigDecimal) n.get("amount"),
                (String) n.get("currency"));
    }

    private Map<String, Object> row(String table, long id, String tenant) {
        var rows =
                db.queryForList(
                        "SELECT * FROM " + table + " WHERE id=? AND tenant_id=?", id, tenant);
        if (rows.isEmpty())
            throw new ApiException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    HttpStatus.NOT_FOUND,
                    "Financial adjustment was not found.");
        return rows.getFirst();
    }

    private Instant instant(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof LocalDateTime local) return local.toInstant(ZoneOffset.UTC);
        return ((java.sql.Timestamp) value).toInstant();
    }

    private String requireBillingTenant() {
        var user = users.requireCurrentUser();
        if (user.getAuthorities().stream()
                .noneMatch(
                        a ->
                                a.getAuthority().equals("ROLE_TENANT_ADMIN")
                                        || a.getAuthority().equals("ROLE_BILLING_ADMIN")))
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "Billing administrator access is required.");
        return access.requireCompanyTenantId();
    }

    private void ensureIssued(Invoice invoice) {
        if (invoice.getStatus() == InvoiceStatus.DRAFT || invoice.getStatus() == InvoiceStatus.VOID)
            throw conflict("Only issued, non-void invoices support financial adjustments.");
    }

    private <T> T intent(
            String key,
            String kind,
            Object request,
            Supplier<Long> operation,
            Function<Long, T> result) {
        access.lockFinancialWrites();
        String tenant = requireBillingTenant();
        if (key == null || !key.matches("[A-Za-z0-9._:-]{1,120}"))
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "A valid Idempotency-Key is required.");
        String hash;
        try {
            hash =
                    HexFormat.of()
                            .formatHex(
                                    MessageDigest.getInstance("SHA-256")
                                            .digest(
                                                    json.writeValueAsBytes(
                                                            List.of(kind, request))));
        } catch (Exception e) {
            throw new IllegalStateException("Financial request encoding failed.");
        }
        var old =
                db.queryForList(
                        "SELECT operation,request_hash,result_id FROM billing_adjustment_intents"
                                + " WHERE tenant_id=? AND request_key=?",
                        tenant,
                        key);
        if (!old.isEmpty()) {
            var n = old.getFirst();
            if (!kind.equals(n.get("operation")) || !hash.equals(n.get("request_hash")))
                throw conflict("This retry key belongs to a different financial adjustment.");
            return result.apply(((Number) n.get("result_id")).longValue());
        }
        long id = operation.get();
        db.update(
                "INSERT INTO"
                    + " billing_adjustment_intents(tenant_id,request_key,operation,request_hash,result_id)"
                    + " VALUES(?,?,?,?,?)",
                tenant,
                key,
                kind,
                hash,
                id);
        return result.apply(id);
    }

    private long insert(String sql, Object... args) {
        var holder = new GeneratedKeyHolder();
        db.update(
                c -> {
                    var p = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                    for (int i = 0; i < args.length; i++) p.setObject(i + 1, args[i]);
                    return p;
                },
                holder);
        return Objects.requireNonNull(holder.getKey()).longValue();
    }

    private void record(String tenant, String action, String type, long id, BigDecimal amount) {
        audit.record(
                new AuditLogCommand(
                        null,
                        tenant,
                        "BILLING",
                        action,
                        type,
                        Long.toString(id),
                        "Manual financial adjustment recorded.",
                        null,
                        Map.of("id", id, "amount", amount)));
    }

    private ApiException conflict(String message) {
        return new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT, message);
    }
}
