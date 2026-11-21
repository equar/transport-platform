package com.transportplatform.tms.features.privacy.application;

import static com.transportplatform.tms.features.privacy.api.PrivacyRetentionRecords.*;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrivacyRetentionService {
  private final JdbcTemplate db;
  private final Clock clock;
  private final CurrentAuthenticatedUserService users;
  private final AuditLogService audit;

  public PrivacyRetentionService(
      JdbcTemplate db, Clock clock, CurrentAuthenticatedUserService users, AuditLogService audit) {
    this.db = db;
    this.clock = clock;
    this.users = users;
    this.audit = audit;
  }

  public String tenant() {
    String id = users.requireCurrentUser().tenantId();
    if (id == null || id.isBlank())
      throw new ApiException(
          ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "A tenant administrator account is required.");
    return id;
  }

  private PrivacyRetentionPolicy policy(String scope) {
    var rows =
        db.query(
            "SELECT * FROM privacy_retention_policies WHERE scope_key=?",
            (r, n) ->
                new PrivacyRetentionPolicy(
                    scope,
                    (Integer) r.getObject("operational_review_days"),
                    (Integer) r.getObject("audit_days"),
                    (Integer) r.getObject("notification_days"),
                    (Boolean) r.getObject("cleanup_enabled"),
                    r.getBoolean("legal_hold")),
            scope);
    return rows.isEmpty()
        ? new PrivacyRetentionPolicy(scope, null, null, null, null, false)
        : rows.getFirst();
  }

  public PrivacyRetentionView view(String scope) {
    var platform = policy("PLATFORM");
    var override = scope.equals("PLATFORM") ? platform : policy(scope);
    var effective =
        new PrivacyRetentionPolicy(
            scope,
            or(override.operationalReviewDays(), platform.operationalReviewDays()),
            or(override.auditDays(), platform.auditDays()),
            or(override.notificationDays(), platform.notificationDays()),
            or(override.cleanupEnabled(), platform.cleanupEnabled()),
            override.legalHold() || platform.legalHold());
    return new PrivacyRetentionView(platform, override, effective, scope.equals("PLATFORM"));
  }

  private <T> T or(T a, T b) {
    return a == null ? b : a;
  }

  @Transactional
  public PrivacyRetentionView save(String scope, PrivacyRetentionRequest request) {
    db.queryForList(
        "SELECT scope_key FROM privacy_retention_policies WHERE scope_key='PLATFORM' FOR UPDATE");
    var old = view(scope);
    if (Boolean.TRUE.equals(request.cleanupEnabled())
        && request.auditDays() == null
        && request.notificationDays() == null
        && old.platform().auditDays() == null
        && old.platform().notificationDays() == null)
      throw new ApiException(
          ErrorCode.VALIDATION_FAILED,
          HttpStatus.BAD_REQUEST,
          "Set an approved audit or notification retention duration before enabling cleanup.");
    db.update(
        "INSERT INTO"
            + " privacy_retention_policies(scope_key,operational_review_days,audit_days,notification_days,cleanup_enabled,legal_hold,updated_by,updated_at)"
            + " VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE"
            + " operational_review_days=VALUES(operational_review_days),audit_days=VALUES(audit_days),notification_days=VALUES(notification_days),cleanup_enabled=VALUES(cleanup_enabled),legal_hold=VALUES(legal_hold),updated_by=VALUES(updated_by),updated_at=VALUES(updated_at)",
        scope,
        request.operationalReviewDays(),
        request.auditDays(),
        request.notificationDays(),
        request.cleanupEnabled(),
        request.legalHold(),
        users.requireCurrentUser().id(),
        LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
    audit.record(
        new AuditLogCommand(
            null,
            scope.equals("PLATFORM") ? null : scope,
            "PRIVACY",
            "RETENTION_CONFIGURED",
            "PRIVACY_POLICY",
            scope,
            "Privacy retention policy updated.",
            old.override(),
            request));
    return view(scope);
  }

  public List<PrivacyReviewCandidate> reviewCandidates(String tenant) {
    var days = view(tenant).effective().operationalReviewDays();
    if (days == null) return List.of();
    LocalDateTime cutoff =
        LocalDateTime.ofInstant(clock.instant().minusSeconds(days * 86400L), ZoneOffset.UTC);
    return db.query(
        "SELECT 'RIDER' AS entity_type,r.id,r.updated_at AS last_activity FROM riders r LEFT JOIN"
            + " privacy_retention_reviews p ON p.tenant_id=r.tenant_id AND p.entity_type='RIDER'"
            + " AND p.entity_id=r.id WHERE r.tenant_id=? AND r.status IN ('INACTIVE','SUSPENDED')"
            + " AND r.updated_at<? AND (p.reviewed_at IS NULL OR p.reviewed_at<?) UNION ALL SELECT"
            + " 'RIDE',r.id,r.updated_at FROM rides r LEFT JOIN privacy_retention_reviews p ON"
            + " p.tenant_id=r.tenant_id AND p.entity_type='RIDE' AND p.entity_id=r.id WHERE"
            + " r.tenant_id=? AND r.status IN"
            + " ('COMPLETED','CANCELLED','FAILED','MISSED','RIDER_NO_SHOW') AND r.updated_at<? AND"
            + " (p.reviewed_at IS NULL OR p.reviewed_at<?) ORDER BY last_activity,id LIMIT 100",
        (rs, n) ->
            new PrivacyReviewCandidate(
                rs.getString("entity_type"),
                rs.getLong("id"),
                rs.getObject("last_activity", LocalDateTime.class).toInstant(ZoneOffset.UTC)),
        tenant,
        cutoff,
        cutoff,
        tenant,
        cutoff,
        cutoff);
  }

  @Transactional
  public void review(String tenant, PrivacyReviewRequest request) {
    String table = request.entityType().equals("RIDER") ? "riders" : "rides";
    if (db.queryForList(
            "SELECT id FROM " + table + " WHERE id=? AND tenant_id=?", request.entityId(), tenant)
        .isEmpty())
      throw new ApiException(
          ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Record not found.");
    db.update(
        "INSERT INTO"
            + " privacy_retention_reviews(tenant_id,entity_type,entity_id,reviewed_at,reviewed_by,retention_reason)"
            + " VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE"
            + " reviewed_at=VALUES(reviewed_at),reviewed_by=VALUES(reviewed_by),retention_reason=VALUES(retention_reason)",
        tenant,
        request.entityType(),
        request.entityId(),
        LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC),
        users.requireCurrentUser().id(),
        request.reason());
    audit.record(
        new AuditLogCommand(
            null,
            tenant,
            "PRIVACY",
            "RETENTION_REVIEWED",
            request.entityType(),
            Long.toString(request.entityId()),
            "Record retention reviewed.",
            null,
            Map.of("entityId", request.entityId(), "retentionReason", request.reason())));
  }

  public List<String> tenants(long offset) {
    return db.queryForList(
        "SELECT id FROM tenants ORDER BY id LIMIT 100 OFFSET ?", String.class, offset);
  }

  @Transactional
  public void cleanPlatform() {
    db.queryForList(
        "SELECT scope_key FROM privacy_retention_policies WHERE scope_key='PLATFORM' FOR UPDATE");
    var p = view("PLATFORM").effective();
    if (Boolean.TRUE.equals(p.cleanupEnabled()) && !p.legalHold() && p.auditDays() != null)
      db.update(
          "DELETE FROM audit_logs WHERE tenant_id IS NULL AND created_at<? ORDER BY id LIMIT 100",
          LocalDateTime.ofInstant(
              clock.instant().minusSeconds(p.auditDays() * 86400L), ZoneOffset.UTC));
  }

  @Transactional
  public void clean(String tenant) {
    db.queryForList(
        "SELECT scope_key FROM privacy_retention_policies WHERE scope_key='PLATFORM' FOR UPDATE");
    db.queryForList(
        "SELECT scope_key FROM privacy_retention_policies WHERE scope_key=? FOR UPDATE", tenant);
    var p = view(tenant).effective();
    if (!Boolean.TRUE.equals(p.cleanupEnabled()) || p.legalHold()) return;
    if (p.notificationDays() != null) {
      LocalDateTime cutoff =
          LocalDateTime.ofInstant(
              clock.instant().minusSeconds(p.notificationDays() * 86400L), ZoneOffset.UTC);
      var ids =
          db.queryForList(
              "SELECT n.id FROM notifications n WHERE n.tenant_id=? AND n.created_at<? AND"
                  + " (n.delivery_status='SENT' OR (n.delivery_status='FAILED' AND"
                  + " n.next_delivery_attempt_at IS NULL)) AND NOT EXISTS (SELECT 1 FROM"
                  + " push_delivery_jobs j WHERE j.notification_id=n.id AND (j.status IN"
                  + " ('PENDING','ACCEPTED') OR j.next_attempt_at IS NOT NULL)) ORDER BY n.id LIMIT"
                  + " 100",
              Long.class,
              tenant,
              cutoff);
      for (long id : ids) {
        db.update("DELETE FROM push_delivery_jobs WHERE notification_id=?", id);
        db.update("DELETE FROM notifications WHERE id=? AND tenant_id=?", id, tenant);
      }
    }
    if (p.auditDays() != null) {
      db.update(
          "DELETE FROM audit_logs WHERE tenant_id=? AND created_at<? ORDER BY id LIMIT 100",
          tenant,
          LocalDateTime.ofInstant(
              clock.instant().minusSeconds(p.auditDays() * 86400L), ZoneOffset.UTC));
    }
  }
}
