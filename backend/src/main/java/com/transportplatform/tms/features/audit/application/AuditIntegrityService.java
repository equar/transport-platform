package com.transportplatform.tms.features.audit.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.privacy.PhiCipher;
import com.transportplatform.tms.features.audit.domain.AuditLog;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.*;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.sql.Timestamp;
import java.util.*;

/** Append-only signed evidence; payload-free external checkpoints make tail rollback detectable. */
@Service
public class AuditIntegrityService {
    public record Verification(
            String scope,
            long headSequence,
            String headSignature,
            long verifiedThrough,
            boolean hasMore,
            long unsealedRecords,
            boolean externalAnchorChecked,
            List<String> issues) {}

    private record Checkpoint(long sequence, String signature) {}

    private final java.util.concurrent.ConcurrentHashMap<String, Checkpoint> remembered =
            new java.util.concurrent.ConcurrentHashMap<>();
    private static final String GENESIS = "0".repeat(64);
    private final JdbcTemplate db;
    private final PhiCipher keys;
    private final ObjectMapper json;

    public AuditIntegrityService(JdbcTemplate db, PhiCipher keys, ObjectMapper json) {
        this.db = db;
        this.keys = keys;
        this.json = json;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void attest(AuditLog log) {
        var row = payload(log.getId());
        if (row == null)
            throw new IllegalStateException("Audit record was not persisted before signing.");
        append(scope(log.getTenantId()), "ENTRY", log.getId(), digest(row));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void retire(String tenant, List<Long> ids) {
        String scope = scope(tenant);
        for (long id : ids) {
            var row = payload(id);
            if (row == null) continue;
            if (!Objects.equals(tenant, row.get("tenant_id")))
                throw new IllegalStateException("Audit retention scope mismatch.");
            String hash = digest(row);
            var proofs =
                    db.queryForList(
                            "SELECT * FROM audit_integrity_ledger WHERE scope_key=? AND audit_id=?"
                                    + " AND event_type='ENTRY' ORDER BY sequence_no DESC LIMIT 1",
                            scope,
                            id);
            if (!proofs.isEmpty()
                    && (!valid(proofs.getFirst())
                            || !hash.equals(proofs.getFirst().get("content_hash"))))
                throw new IllegalStateException(
                        "Audit integrity failed before retention; deletion stopped.");
            append(scope, "RETENTION_DELETE", id, hash);
            db.update(
                    "DELETE FROM audit_logs WHERE id=? AND "
                            + (tenant == null ? "tenant_id IS NULL" : "tenant_id=?"),
                    tenant == null ? new Object[] {id} : new Object[] {id, tenant});
        }
    }

    private String scope(String tenant) {
        return tenant == null ? "PLATFORM" : tenant;
    }

    private void append(String scope, String type, long auditId, String content) {
        db.update(
                "INSERT INTO audit_integrity_heads(scope_key,sequence_no,signature)"
                        + " VALUES(?,0,?) ON DUPLICATE KEY UPDATE scope_key=audit_integrity_heads.scope_key",
                scope,
                GENESIS);
        var head =
                db.queryForMap(
                        "SELECT * FROM audit_integrity_heads WHERE scope_key=? FOR UPDATE", scope);
        long seq = ((Number) head.get("sequence_no")).longValue() + 1;
        String previous = (String) head.get("signature");
        var known = remembered.get(scope);
        if (known != null
                && (seq - 1 < known.sequence()
                        || (seq - 1 == known.sequence() && !previous.equals(known.signature()))))
            throw new IllegalStateException("Audit chain rollback detected; append stopped.");
        // Refuse appending to a head that no longer matches its authenticated final record.
        if (seq > 1) {
            var last =
                    db.queryForList(
                            "SELECT * FROM audit_integrity_ledger WHERE scope_key=? AND"
                                    + " sequence_no=? FOR SHARE",
                            scope,
                            seq - 1);
            if (last.isEmpty()
                    || !valid(last.getFirst())
                    || !previous.equals(last.getFirst().get("signature")))
                throw new IllegalStateException("Audit chain head could not be authenticated.");
        }
        String signature = sign(scope, seq, type, auditId, content, previous);
        db.update(
                "INSERT INTO"
                    + " audit_integrity_ledger(scope_key,sequence_no,event_type,audit_id,content_hash,previous_signature,signature)"
                    + " VALUES(?,?,?,?,?,?,?)",
                scope,
                seq,
                type,
                auditId,
                content,
                previous,
                signature);
        db.update(
                "UPDATE audit_integrity_heads SET sequence_no=?,signature=? WHERE scope_key=?",
                seq,
                signature,
                scope);
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        remembered.compute(
                                scope,
                                (ignored, old) ->
                                        old == null || old.sequence() < seq
                                                ? new Checkpoint(seq, signature)
                                                : old);
                        org.slf4j.LoggerFactory.getLogger(AuditIntegrityService.class)
                                .info(
                                        "AUDIT_CHECKPOINT scope={} sequence={} signature={}",
                                        scope,
                                        seq,
                                        signature);
                    }
                });
    }

    private String sign(
            String scope, long seq, String type, long id, String content, String previous) {
        try {
            return keys.auditSignature(
                    json.writeValueAsString(List.of(scope, seq, type, id, content, previous)));
        } catch (Exception e) {
            throw new IllegalStateException("Audit integrity signing failed.");
        }
    }

    private boolean valid(Map<String, Object> row) {
        String expected =
                sign(
                        (String) row.get("scope_key"),
                        ((Number) row.get("sequence_no")).longValue(),
                        (String) row.get("event_type"),
                        ((Number) row.get("audit_id")).longValue(),
                        (String) row.get("content_hash"),
                        (String) row.get("previous_signature"));
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII),
                ((String) row.get("signature")).getBytes(StandardCharsets.US_ASCII));
    }

    private Map<String, Object> payload(long id) {
        var rows = db.queryForList("SELECT * FROM audit_logs WHERE id=?", id);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private String digest(Map<String, Object> row) {
        var canonical = new TreeMap<String, Object>();
        row.forEach(
                (key, value) ->
                        canonical.put(
                                key.toLowerCase(Locale.ROOT),
                                value instanceof Timestamp t
                                        ? t.toInstant().toString()
                                        : value instanceof java.time.LocalDateTime local
                                                ? local.toInstant(java.time.ZoneOffset.UTC)
                                                        .toString()
                                                : value));
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(json.writeValueAsBytes(canonical)));
        } catch (Exception e) {
            throw new IllegalStateException("Audit integrity digest failed.");
        }
    }

    @Transactional(readOnly = true)
    public Verification verify(
            String tenant, long after, Long expectedSequence, String expectedSignature) {
        var authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();
        if (authentication == null
                || !(authentication.getPrincipal()
                        instanceof
                        com.transportplatform.tms.common.security.AuthenticatedUser user))
            throw new com.transportplatform.tms.common.exception.ApiException(
                    com.transportplatform.tms.common.exception.ErrorCode.UNAUTHORIZED,
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Authentication is required to verify audit history.");
        boolean platform =
                user.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"));
        if (!platform
                && (tenant == null
                        || !tenant.equals(user.tenantId())
                        || user.getAuthorities().stream()
                                .noneMatch(a -> a.getAuthority().equals("ROLE_TENANT_ADMIN"))))
            throw new com.transportplatform.tms.common.exception.ApiException(
                    com.transportplatform.tms.common.exception.ErrorCode.FORBIDDEN,
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Audit verification is restricted to your company.");
        String scope = scope(tenant);
        var issues = new ArrayList<String>();
        // Capture before the database snapshot: a concurrent commit may advance memory later.
        var known = remembered.get(scope);
        var heads = db.queryForList("SELECT * FROM audit_integrity_heads WHERE scope_key=?", scope);
        long head =
                heads.isEmpty() ? 0 : ((Number) heads.getFirst().get("sequence_no")).longValue();
        String signature = heads.isEmpty() ? GENESIS : (String) heads.getFirst().get("signature");
        if (known != null
                && (head < known.sequence()
                        || (head == known.sequence() && !signature.equals(known.signature()))))
            issues.add("PROCESS_CHECKPOINT_ROLLBACK");
        if (expectedSequence != null && expectedSignature != null && expectedSequence > 0) {
            var anchored =
                    db.queryForList(
                            "SELECT * FROM audit_integrity_ledger WHERE scope_key=? AND"
                                    + " sequence_no=? FOR SHARE",
                            scope,
                            expectedSequence);
            if (head < expectedSequence
                    || anchored.isEmpty()
                    || !valid(anchored.getFirst())
                    || !expectedSignature.equals(anchored.getFirst().get("signature")))
                issues.add("EXTERNAL_CHECKPOINT_MISMATCH");
        }
        String previous = GENESIS;
        if (after > 0) {
            var prev =
                    db.queryForList(
                            "SELECT * FROM audit_integrity_ledger WHERE scope_key=? AND"
                                    + " sequence_no=? FOR SHARE",
                            scope,
                            after);
            if (prev.isEmpty() || !valid(prev.getFirst()))
                issues.add("INVALID_STARTING_CHECKPOINT");
            else previous = (String) prev.getFirst().get("signature");
        }
        var rows =
                db.queryForList(
                        "SELECT * FROM audit_integrity_ledger WHERE scope_key=? AND sequence_no>?"
                                + " ORDER BY sequence_no LIMIT 1000",
                        scope,
                        after);
        var entryIds =
                rows.stream()
                        .filter(r -> r.get("event_type").equals("ENTRY"))
                        .map(r -> ((Number) r.get("audit_id")).longValue())
                        .distinct()
                        .toList();
        var dataById = new java.util.HashMap<Long, Map<String, Object>>();
        var retiredById = new java.util.HashMap<Long, String>();
        if (!entryIds.isEmpty()) {
            String placeholders =
                    String.join(",", java.util.Collections.nCopies(entryIds.size(), "?"));
            for (var data :
                    db.queryForList(
                            "SELECT * FROM audit_logs WHERE id IN (" + placeholders + ")",
                            entryIds.toArray()))
                dataById.put(((Number) data.get("id")).longValue(), data);
            var args = new java.util.ArrayList<Object>();
            args.add(scope);
            args.addAll(entryIds);
            for (var proof :
                    db.queryForList(
                            "SELECT * FROM audit_integrity_ledger WHERE scope_key=? AND"
                                    + " event_type='RETENTION_DELETE' AND audit_id IN ("
                                    + placeholders
                                    + ")",
                            args.toArray()))
                if (valid(proof))
                    retiredById.put(
                            ((Number) proof.get("audit_id")).longValue(),
                            (String) proof.get("content_hash"));
        }
        long verified = after;
        for (var row : rows) {
            long seq = ((Number) row.get("sequence_no")).longValue();
            if (seq != verified + 1
                    || !previous.equals(row.get("previous_signature"))
                    || !valid(row)) {
                issues.add("BROKEN_CHAIN_AT_" + seq);
                break;
            }
            long id = ((Number) row.get("audit_id")).longValue();
            if (row.get("event_type").equals("ENTRY")) {
                var data = dataById.get(id);
                if (data == null) {
                    if (!Objects.equals(retiredById.get(id), row.get("content_hash")))
                        issues.add("UNAUTHORIZED_DELETION_" + id);
                } else if (!digest(data).equals(row.get("content_hash")))
                    issues.add("MODIFIED_AUDIT_RECORD_" + id);
            }
            previous = (String) row.get("signature");
            verified = seq;
        }
        if (verified >= head && !signature.equals(previous)) issues.add("INVALID_CHAIN_HEAD");
        if (verified < head && rows.size() < 1000) issues.add("MISSING_CHAIN_TAIL");
        long unsealed =
                db.queryForObject(
                        "SELECT COUNT(*) FROM audit_logs a WHERE "
                                + (tenant == null ? "a.tenant_id IS NULL" : "a.tenant_id=?")
                                + " AND NOT EXISTS (SELECT 1 FROM audit_integrity_ledger l WHERE"
                                + " l.scope_key=? AND l.audit_id=a.id AND l.event_type='ENTRY')",
                        Long.class,
                        tenant == null ? new Object[] {scope} : new Object[] {tenant, scope});
        return new Verification(
                scope,
                head,
                signature,
                verified,
                verified < head,
                unsealed,
                expectedSequence != null
                        && expectedSequence > 0
                        && expectedSignature != null
                        && !issues.contains("EXTERNAL_CHECKPOINT_MISMATCH"),
                List.copyOf(issues));
    }
}
