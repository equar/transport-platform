package com.transportplatform.tms.features.subscriptionbilling.application;

import static com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.*;
import java.math.BigDecimal;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionBillingService {
  @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.common.privacy.PhiCipher privacy;
  private final JdbcTemplate db;
  private final Clock clock;
  private final CurrentAuthenticatedUserService users;
  private final AuditLogService audit;
  private final ObjectMapper json;
  private final List<SubscriptionPaymentCollector> collectors;

  public SubscriptionBillingService(
      JdbcTemplate db,
      Clock clock,
      CurrentAuthenticatedUserService users,
      AuditLogService audit,
      ObjectMapper json,
      List<SubscriptionPaymentCollector> collectors) {
    this.db = db;
    this.clock = clock;
    this.users = users;
    this.audit = audit;
    this.json = json;
    this.collectors = collectors;
  }

  private LocalDate today() {
    return LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
  }

  private static ApiException invalid(String message) {
    return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
  }

  private static ApiException missing() {
    return new ApiException(
        ErrorCode.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "Subscription billing record was not found.");
  }

  private static LocalDate date(ResultSet r, String name) throws SQLException {
    var d = r.getDate(name);
    return d == null ? null : d.toLocalDate();
  }

  private static Instant instant(ResultSet r, String name) throws SQLException {
    var t = r.getTimestamp(name, Calendar.getInstance(TimeZone.getTimeZone("UTC")));
    return t == null ? null : t.toInstant();
  }

  private static Timestamp timestamp(Instant i) {
    return Timestamp.valueOf(LocalDateTime.ofInstant(i, ZoneOffset.UTC));
  }

  private static final RowMapper<Invoice> INVOICE =
      (r, n) ->
          new Invoice(
              r.getLong("id"),
              r.getLong("subscription_id"),
              r.getString("tenant_id"),
              r.getString("tenant_name"),
              r.getString("plan_code"),
              date(r, "period_start"),
              date(r, "period_end"),
              date(r, "due_date"),
              instant(r, "metered_at"),
              r.getInt("driver_count"),
              r.getString("driver_ids_json"),
              r.getBigDecimal("monthly_driver_rate"),
              r.getString("currency"),
              r.getBigDecimal("amount").subtract(r.getBigDecimal("credited_amount")),
              r.getBigDecimal("paid_amount"),
              r.getString("collection_mode"),
              r.getString("collection_state"),
              r.getString("status"),
              instant(r, "created_at"), r.getBigDecimal("credited_amount"), r.getBigDecimal("amount"));

  private boolean automaticAvailable() {
    return collectors.stream().anyMatch(SubscriptionPaymentCollector::available);
  }

  public Account account(long subscriptionId, String tenantScope) {
    var rows =
        db.query(
            "SELECT a.*,t.company_name,s.status AS subscription_status,p.plan_code FROM"
                + " subscription_billing_accounts a JOIN tenant_subscriptions s ON"
                + " s.id=a.subscription_id JOIN tenants t ON t.id=a.tenant_id JOIN"
                + " subscription_plans p ON p.id=s.subscription_plan_id WHERE a.subscription_id=?"
                + (tenantScope == null ? "" : " AND a.tenant_id=?"),
            (r, n) ->
                new Account(
                    r.getLong("subscription_id"),
                    r.getString("tenant_id"),
                    r.getString("company_name"),
                    r.getString("plan_code"),
                    r.getString("subscription_status"),
                    r.getBoolean("enabled"),
                    r.getBigDecimal("monthly_driver_rate"),
                    "USD",
                    date(r, "first_renewal_date"),
                    date(r, "next_renewal_date"),
                    instant(r, "next_renewal_at"),
                    (Integer) r.getObject("anchor_day"),
                    r.getInt("payment_due_days"),
                    r.getString("collection_mode"),
                    automaticAvailable(),
                    activeDriverCount(r.getString("tenant_id")),
                    null,
                    null),
            tenantScope == null
                ? new Object[] {subscriptionId}
                : new Object[] {subscriptionId, tenantScope});
    if (rows.isEmpty()) throw missing();
    Account a = rows.getFirst();
    var pending =
        db.query(
            "SELECT effective_on,monthly_driver_rate FROM subscription_billing_rates WHERE"
                + " subscription_id=? AND effective_on>? ORDER BY effective_on DESC LIMIT 1",
            (r, n) -> Map.entry(date(r, "effective_on"), r.getBigDecimal("monthly_driver_rate")),
            subscriptionId,
            today());
    return pending.isEmpty()
        ? a
        : new Account(
            a.subscriptionId(),
            a.tenantId(),
            a.tenantName(),
            a.planCode(),
            a.subscriptionStatus(),
            a.enabled(),
            a.monthlyDriverRate(),
            a.currency(),
            a.firstRenewalDate(),
            a.nextRenewalDate(),
            a.nextRenewalAt(),
            a.anchorDay(),
            a.paymentDueDays(),
            a.collectionMode(),
            a.automaticAvailable(),
            a.activeDrivers(),
            pending.getFirst().getKey(),
            pending.getFirst().getValue());
  }

  private long activeDriverCount(String tenantId) {
    return db.queryForObject(
        "SELECT COUNT(*) FROM drivers WHERE tenant_id=? AND status='ACTIVE'", Long.class, tenantId);
  }

  public PageResponse<Account> accounts(String tenantScope, int page, int size) {
    page = Math.max(0, page);
    size = Math.max(1, Math.min(100, size));
    String where = tenantScope == null ? "" : " WHERE tenant_id=?";
    var args = new ArrayList<Object>();
    if (tenantScope != null) args.add(tenantScope);
    long count =
        db.queryForObject(
            "SELECT COUNT(*) FROM subscription_billing_accounts" + where,
            Long.class,
            args.toArray());
    args.add(size);
    args.add(page * size);
    var ids =
        db.queryForList(
            "SELECT subscription_id FROM subscription_billing_accounts"
                + where
                + " ORDER BY subscription_id DESC LIMIT ? OFFSET ?",
            Long.class,
            args.toArray());
    return new PageResponse<>(
        ids.stream().map(id -> account(id, tenantScope)).toList(),
        count,
        (int) ((count + size - 1) / size),
        page,
        size);
  }

  @Transactional
  public Account configure(long id, Configure request) {
    var tenants =
        db.queryForList(
            "SELECT tenant_id FROM subscription_billing_accounts WHERE subscription_id=?",
            String.class,
            id);
    if (tenants.isEmpty()) throw missing();
    db.queryForList("SELECT id FROM tenants WHERE id=? FOR UPDATE", tenants.getFirst());
    db.queryForList(
        "SELECT subscription_id FROM subscription_billing_accounts WHERE subscription_id=? FOR"
            + " UPDATE",
        id);
    Account old = account(id, null);
    if (request.enabled()
        && !db.queryForList(
                "SELECT subscription_id FROM subscription_billing_accounts WHERE tenant_id=? AND"
                    + " enabled=TRUE AND subscription_id<>? FOR UPDATE",
                old.tenantId(),
                id)
            .isEmpty())
      throw invalid("Another subscription already has billing enabled for this company.");
    if (request.collectionMode().equals("AUTOMATIC") && !automaticAvailable())
      throw invalid(
          "Automatic collection requires a configured payment-provider adapter. Use Manual for"
              + " now.");
    if (request.enabled() && !Set.of("ACTIVE", "TRIAL").contains(old.subscriptionStatus()))
      throw invalid("Only active or trial subscriptions can be configured for billing.");
    LocalDate first = request.firstRenewalDate();
    var subscription =
        db.queryForMap(
            "SELECT effective_start_date,effective_end_date,is_trial,trial_end_date FROM"
                + " tenant_subscriptions WHERE id=? FOR UPDATE",
            id);
    if (old.firstRenewalDate() == null) {
      if (first.isBefore(today()))
        throw invalid(
            "The first renewal cannot be backdated. Historical driver counts before configuration"
                + " are not billable.");
      if (first.isBefore(((java.sql.Date) subscription.get("effective_start_date")).toLocalDate()))
        throw invalid("Billing cannot start before the subscription starts.");
      var trialEnd = (java.sql.Date) subscription.get("trial_end_date");
      if (Boolean.TRUE.equals(subscription.get("is_trial"))
          && trialEnd != null
          && !first.equals(trialEnd.toLocalDate().plusDays(1)))
        throw invalid("A paid trial must renew the day after the trial end date.");
      Instant at =
          first.equals(today())
              ? clock.instant().truncatedTo(java.time.temporal.ChronoUnit.MICROS)
              : first.atStartOfDay().toInstant(ZoneOffset.UTC);
      LocalTime time = LocalDateTime.ofInstant(at, ZoneOffset.UTC).toLocalTime();
      db.update(
          "UPDATE subscription_billing_accounts SET"
              + " first_renewal_date=?,next_renewal_date=?,next_renewal_at=?,anchor_day=?,anchor_time=?"
              + " WHERE subscription_id=?",
          first,
          first,
          timestamp(at),
          first.getDayOfMonth(),
          time,
          id);
    } else if (!first.equals(old.firstRenewalDate()))
      throw invalid(
          "The billing anchor cannot be changed after configuration. Create a replacement"
              + " subscription instead.");
    Account current = account(id, null);
    LocalDate effective = current.nextRenewalDate();
    // Changed prices apply to a future boundary; delayed historical renewals retain their original
    // rate.
    if (old.firstRenewalDate() != null)
      while (!effective.isAfter(today()))
        effective = SubscriptionBillingCalendar.nextRenewal(effective, current.anchorDay());
    db.update(
        "INSERT INTO subscription_billing_rates(subscription_id,effective_on,monthly_driver_rate)"
            + " VALUES (?,?,?) ON DUPLICATE KEY UPDATE"
            + " monthly_driver_rate=VALUES(monthly_driver_rate)",
        id,
        effective,
        request.monthlyDriverRate());
    db.update(
        "UPDATE subscription_billing_accounts SET"
            + " monthly_driver_rate=?,payment_due_days=?,collection_mode=?,enabled=?,updated_at=UTC_TIMESTAMP(6)"
            + " WHERE subscription_id=?",
        request.monthlyDriverRate(),
        request.paymentDueDays(),
        request.collectionMode(),
        request.enabled(),
        id);
    db.update("UPDATE tenant_subscriptions SET renewal_date=? WHERE id=?", current.nextRenewalDate(), id);
    Account saved = account(id, null);
    record(
        old.tenantId(),
        "CONFIGURED",
        "SUBSCRIPTION_BILLING",
        id,
        "Per-driver USD subscription billing configured.",
        old,
        saved);
    return saved;
  }

  @Transactional
  public Long generateRenewal(long id) {
    var locked =
        db.queryForList(
            "SELECT a.*,TIME_FORMAT(a.anchor_time,'%H:%i:%s.%f') AS anchor_time_text,s.status AS"
                + " subscription_status,s.effective_end_date,s.trial_end_date,t.company_name,t.status"
                + " AS tenant_status,p.plan_code FROM subscription_billing_accounts a JOIN"
                + " tenant_subscriptions s ON s.id=a.subscription_id JOIN tenants t ON"
                + " t.id=a.tenant_id JOIN subscription_plans p ON p.id=s.subscription_plan_id WHERE"
                + " a.subscription_id=? FOR UPDATE",
            id);
    if (locked.isEmpty()) throw missing();
    var row = locked.getFirst();
    if (!Boolean.TRUE.equals(row.get("enabled")) || row.get("next_renewal_at") == null) return null;
    var rawAt = row.get("next_renewal_at");
    var at =
        (rawAt instanceof LocalDateTime local ? local : ((Timestamp) rawAt).toLocalDateTime())
            .toInstant(ZoneOffset.UTC);
    if (at.isAfter(clock.instant())) return null;
    String status = (String) row.get("subscription_status");
    if (!Set.of("ACTIVE", "TRIAL").contains(status)) return null;
    if (!"ACTIVE".equals(row.get("tenant_status"))) return null;
    LocalDate start = ((java.sql.Date) row.get("next_renewal_date")).toLocalDate();
    java.sql.Date end = (java.sql.Date) row.get("effective_end_date");
    if (end != null && !start.isBefore(end.toLocalDate())) return null;
    java.sql.Date trialEnd = (java.sql.Date) row.get("trial_end_date");
    if ("TRIAL".equals(status) && (trialEnd == null || !start.isAfter(trialEnd.toLocalDate())))
      return null;
    var rates =
        db.queryForList(
            "SELECT monthly_driver_rate FROM subscription_billing_rates WHERE subscription_id=? AND"
                + " effective_on<=? ORDER BY effective_on DESC LIMIT 1",
            BigDecimal.class,
            id,
            start);
    if (rates.isEmpty()) throw invalid("No configured rate exists for this renewal.");
    BigDecimal rate = rates.getFirst();
    String tenant = (String) row.get("tenant_id");
    List<Long> drivers =
        db.queryForList(
            "SELECT DISTINCT driver_id FROM subscription_driver_status_periods WHERE tenant_id=?"
                + " AND status='ACTIVE' AND effective_from<=? AND (effective_to IS NULL OR"
                + " effective_to>?) ORDER BY driver_id",
            Long.class,
            tenant,
            timestamp(at),
            timestamp(at));
    LocalDate next =
        SubscriptionBillingCalendar.nextRenewal(start, ((Number) row.get("anchor_day")).intValue());
    BigDecimal amount = SubscriptionBillingCalendar.amount(rate, drivers.size());
    String ids;
    try {
      ids = json.writeValueAsString(drivers);
    } catch (Exception e) {
      throw new IllegalStateException("Driver metering serialization failed");
    }
    db.update(
        "INSERT INTO"
            + " platform_subscription_invoices(subscription_id,tenant_id,tenant_name,plan_code,period_start,period_end,due_date,metered_at,driver_count,driver_ids_json,monthly_driver_rate,amount,collection_mode,status)"
            + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        id,
        tenant,
        row.get("company_name"),
        row.get("plan_code"),
        start,
        next,
        start.plusDays(((Number) row.get("payment_due_days")).intValue()),
        timestamp(at),
        drivers.size(),
        ids,
        rate,
        amount,
        row.get("collection_mode"),
        amount.signum() == 0 ? "PAID" : "ISSUED");
    long invoiceId =
        db.queryForObject(
            "SELECT id FROM platform_subscription_invoices WHERE subscription_id=? AND"
                + " period_start=?",
            Long.class,
            id,
            start);
    var anchorTime = LocalTime.parse((String) row.get("anchor_time_text"));
    db.update(
        "UPDATE subscription_billing_accounts SET next_renewal_date=?,next_renewal_at=? WHERE"
            + " subscription_id=?",
        next,
        Timestamp.valueOf(next.atTime(anchorTime)),
        id);
    db.update(
        "UPDATE tenant_subscriptions SET"
            + " renewal_date=?,status='ACTIVE',is_trial=FALSE,updated_by='billing',updated_at=UTC_TIMESTAMP(6)"
            + " WHERE id=?",
        next,
        id);
    record(
        tenant,
        "ISSUED",
        "PLATFORM_SUBSCRIPTION_INVOICE",
        invoiceId,
        "Monthly subscription invoice issued from active drivers at renewal.",
        null,
        invoice(invoiceId, null));
    return invoiceId;
  }

  public Invoice invoice(long id, String scope) {
    var rows =
        db.query(
            "SELECT * FROM platform_subscription_invoices WHERE id=?"
                + (scope == null ? "" : " AND tenant_id=?"),
            INVOICE,
            scope == null ? new Object[] {id} : new Object[] {id, scope});
    if (rows.isEmpty()) throw missing();
    Invoice i = rows.getFirst();
    if (i.status().equals("ISSUED") && i.dueDate().isBefore(today()))
      return new Invoice(
          i.id(),
          i.subscriptionId(),
          i.tenantId(),
          i.tenantName(),
          i.planCode(),
          i.periodStart(),
          i.periodEnd(),
          i.dueDate(),
          i.meteredAt(),
          i.driverCount(),
          i.driverIdsJson(),
          i.monthlyDriverRate(),
          i.currency(),
          i.amount(),
          i.paidAmount(),
          i.collectionMode(),
          i.collectionState(),
          "OVERDUE",
          i.createdAt(), i.creditedAmount(), i.originalAmount());
    return i;
  }

  public PageResponse<Invoice> invoices(String scope, Long subscriptionId, int page, int size) {
    page = Math.max(0, page);
    size = Math.max(1, Math.min(100, size));
    String where = " WHERE 1=1";
    var args = new ArrayList<Object>();
    if (scope != null) {
      where += " AND tenant_id=?";
      args.add(scope);
    }
    if (subscriptionId != null) {
      where += " AND subscription_id=?";
      args.add(subscriptionId);
    }
    long count =
        db.queryForObject(
            "SELECT COUNT(*) FROM platform_subscription_invoices" + where,
            Long.class,
            args.toArray());
    args.add(size);
    args.add(page * size);
    var ids =
        db.queryForList(
            "SELECT id FROM platform_subscription_invoices"
                + where
                + " ORDER BY id DESC LIMIT ? OFFSET ?",
            Long.class,
            args.toArray());
    return new PageResponse<>(
        ids.stream().map(id -> invoice(id, scope)).toList(),
        count,
        (int) ((count + size - 1) / size),
        page,
        size);
  }

  public InvoiceDetail detail(long id, String scope) {
    Invoice i = invoice(id, scope);
    var payments =
        db.query(
            "SELECT * FROM platform_subscription_payments WHERE invoice_id=? ORDER BY id",
            (r, n) ->
                new Payment(
                    r.getLong("id"),
                    r.getLong("invoice_id"),
                    r.getBigDecimal("amount"),
                    r.getString("payment_reference"),
                    r.getString("source"),
                    r.getString("recorded_by"),
                    instant(r, "recorded_at")),
            id);
    var adjustments = db.query("SELECT * FROM platform_subscription_adjustments WHERE tenant_id=? AND invoice_id=? ORDER BY id",
            (r,n) -> new Adjustment(r.getLong("id"),r.getObject("payment_id")==null?null:r.getLong("payment_id"),r.getString("kind"),r.getBigDecimal("amount"),r.getString("reference"),privacy.decrypt(r.getString("reason"),"text"),instant(r,"created_at")),i.tenantId(),id);
    return new InvoiceDetail(i, payments, adjustments);
  }

  @Transactional
  public Invoice recordManualPayment(long id, PaymentRequest request) {
    return settle(
        id,
        request.amount(),
        request.reference().trim(),
        "MANUAL",
        users.requireCurrentUser().username());
  }

  private Invoice settle(
      long id, BigDecimal amount, String reference, String source, String actor) {
    db.queryForList("SELECT id FROM platform_subscription_invoices WHERE id=? FOR UPDATE", id);
    Invoice i = invoice(id, null);
    var prior =
        db.queryForList(
            "SELECT invoice_id,amount FROM platform_subscription_payments WHERE source=? AND"
                + " payment_reference=?",
            source,
            reference);
    if (!prior.isEmpty()) {
      var p = prior.getFirst();
      if (((Number) p.get("invoice_id")).longValue() != id
          || ((BigDecimal) p.get("amount")).compareTo(amount) != 0)
        throw new ApiException(
            ErrorCode.RESOURCE_CONFLICT,
            HttpStatus.CONFLICT,
            "Payment reference already belongs to another payment.");
      return i;
    }
    if (source.equals("MANUAL")
        && i.collectionMode().equals("AUTOMATIC")
        && !i.collectionState().equals("NOT_ATTEMPTED"))
      throw invalid("Reconcile the automatic collection before recording a manual payment.");
    if (amount.signum() <= 0
        || amount.scale() > 2
        || amount.compareTo(i.amount().subtract(i.paidAmount())) > 0)
      throw invalid("Payment must be positive and cannot exceed the outstanding USD balance.");
    try {
      db.update(
          "INSERT INTO"
              + " platform_subscription_payments(invoice_id,amount,payment_reference,source,recorded_by)"
              + " VALUES (?,?,?,?,?)",
          id,
          amount,
          reference,
          source,
          actor);
    } catch (org.springframework.dao.DuplicateKeyException duplicate) {
      throw new ApiException(
          ErrorCode.RESOURCE_CONFLICT,
          HttpStatus.CONFLICT,
          "Payment reference already belongs to another payment.");
    }
    BigDecimal paid = i.paidAmount().add(amount);
    db.update(
        "UPDATE platform_subscription_invoices SET paid_amount=?,status=? WHERE id=?",
        paid,
        paid.compareTo(i.amount()) == 0 ? "PAID" : "ISSUED",
        id);
    Invoice saved = invoice(id, null);
    record(
        i.tenantId(),
        "PAYMENT_RECORDED",
        "PLATFORM_SUBSCRIPTION_INVOICE",
        id,
        "Subscription payment recorded.",
        i,
        saved);
    return saved;
  }

  public String collectionProvider(long id) {
    return db.queryForObject("SELECT collection_provider FROM platform_subscription_invoices WHERE id=?",String.class,id);
  }

  public record CollectionAttempt(Invoice invoice, boolean startCharge) {}

  @Transactional
  public CollectionAttempt beginAutomaticCollection(long id, String provider, boolean reconciliationOnly) {
    db.queryForList("SELECT id FROM platform_subscription_invoices WHERE id=? FOR UPDATE", id);
    Invoice i = invoice(id, null);
    if (!i.collectionMode().equals("AUTOMATIC") || i.status().equals("PAID")) return new CollectionAttempt(i,false);
    String bound = collectionProvider(id);
    if (bound != null && !bound.equals(provider)) throw invalid("Use the original payment provider to reconcile this invoice.");
    if (provider == null || !provider.matches("[A-Za-z0-9._$-]{1,120}")) throw invalid("Configure a stable payment provider identifier.");
    boolean start = i.collectionState().equals("NOT_ATTEMPTED") && !reconciliationOnly;
    if (!start && i.collectionState().equals("NOT_ATTEMPTED")) return new CollectionAttempt(i,false);
    if (!automaticAvailable()) throw invalid("No automatic payment provider is configured.");
    db.update("UPDATE platform_subscription_invoices SET collection_state='PENDING',collection_provider=? WHERE id=?",provider,id);
    return new CollectionAttempt(invoice(id,null),start);
  }

  @Transactional
  public Invoice finishAutomaticCollection(long id, SubscriptionPaymentCollector.Result result) {
    db.queryForList("SELECT id FROM platform_subscription_invoices WHERE id=? FOR UPDATE", id);
    Invoice i = invoice(id, null);
    if (i.status().equals("PAID")) return i;
    if (!i.collectionMode().equals("AUTOMATIC") || !i.collectionState().equals("PENDING"))
      throw invalid("No automatic collection is pending for this invoice.");
    if (result == null) return i;
    if (result.verifiedNotCharged() && !result.settled()) {
      db.update("UPDATE platform_subscription_invoices SET collection_state='NOT_ATTEMPTED' WHERE id=?",id);
      record(i.tenantId(),"COLLECTION_NOT_CHARGED","PLATFORM_SUBSCRIPTION_INVOICE",id,"Provider confirmed no payment was collected.",i,invoice(id,null));
      return invoice(id,null);
    }
    if (!result.settled()) return i;
    if (!"USD".equals(result.currency())
        || result.reference() == null
        || result.reference().isBlank()
        || result.reference().length() > 150
        || result.amount() == null
        || result.amount().compareTo(i.amount().subtract(i.paidAmount())) != 0) {
      db.update(
          "UPDATE platform_subscription_invoices SET collection_state='REVIEW_REQUIRED' WHERE id=?",
          id);
      return invoice(id, null);
    }
    settle(id, result.amount(), result.reference(), "AUTOMATIC", "payment-provider");
    db.update(
        "UPDATE platform_subscription_invoices SET collection_state='SETTLED' WHERE id=?", id);
    return invoice(id, null);
  }

  public List<Long> dueAccounts(long afterId, int limit) {
    return db.queryForList(
        "SELECT subscription_id FROM subscription_billing_accounts WHERE enabled=TRUE AND"
            + " next_renewal_at<=? AND subscription_id>? ORDER BY subscription_id LIMIT ?",
        Long.class,
        timestamp(clock.instant()),
        afterId,
        Math.min(200, limit));
  }

  public List<Long> automaticInvoices(long afterId) {
    return db.queryForList(
        "SELECT id FROM platform_subscription_invoices WHERE collection_mode='AUTOMATIC' AND"
            + " status='ISSUED' AND collection_state<>'REVIEW_REQUIRED' AND id>? ORDER BY id LIMIT"
            + " 100",
        Long.class,
        afterId);
  }

  private void record(
      String tenant,
      String action,
      String type,
      long id,
      String summary,
      Object old,
      Object saved) {
    audit.record(
        new AuditLogCommand(
            null,
            tenant,
            "SUBSCRIPTION_BILLING",
            action,
            type,
            Long.toString(id),
            summary,
            old,
            saved));
  }
}
