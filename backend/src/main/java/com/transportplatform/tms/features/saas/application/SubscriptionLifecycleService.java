package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.auth.application.AuthSessionService;
import com.transportplatform.tms.features.audit.application.*;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionLifecycleService {
    private final JdbcTemplate db;
    private final TenantEntitlementService access;
    private final AuthSessionService sessions;
    private final AuditLogService audit;
    public SubscriptionLifecycleService(JdbcTemplate db, TenantEntitlementService access, AuthSessionService sessions, AuditLogService audit) {
        this.db=db; this.access=access; this.sessions=sessions; this.audit=audit;
    }
    public List<Long> candidates(long after) {
        return db.queryForList("SELECT id FROM tenant_subscriptions WHERE status IN ('ACTIVE','TRIAL') AND id>? ORDER BY id LIMIT 100", Long.class, after);
    }
    @Transactional
    public void reconcile(long id) {
        var tenants = db.queryForList("SELECT tenant_id FROM tenant_subscriptions WHERE id=?", String.class, id);
        if (tenants.isEmpty()) return;
        String tenant = tenants.getFirst();
        access.lockTenant(tenant);
        var rows=db.queryForList("SELECT s.*,a.enabled AS billing_enabled FROM tenant_subscriptions s LEFT JOIN subscription_billing_accounts a ON a.subscription_id=s.id WHERE s.id=? FOR UPDATE", id);
        if (rows.isEmpty()) return;
        var r=rows.getFirst();
        String old=(String) r.get("status");
        if (!Set.of("ACTIVE","TRIAL").contains(old)) return;
        LocalDate today=access.today();
        boolean managed=Boolean.TRUE.equals(r.get("billing_enabled"));
        String next=null;
        if (ended(r,"effective_end_date",today,false)
            || (!managed && "TRIAL".equals(old) && (r.get("trial_end_date")==null || ended(r,"trial_end_date",today,true)))
            || (!managed && ended(r,"renewal_date",today,true))) next="EXPIRED";
        else if (access.hasOverdueBalance(tenant)) next="SUSPENDED";
        if (next==null) return;
        db.update("UPDATE tenant_subscriptions SET status=?,updated_by='subscription-lifecycle',updated_at=UTC_TIMESTAMP(6) WHERE id=?",next,id);
        db.update("UPDATE subscription_billing_accounts SET enabled=FALSE WHERE subscription_id=?",id);
        sessions.revokeAllForTenant(tenant);
        audit.record(new AuditLogCommand(null,tenant,"SAAS_TENANT_SUBSCRIPTION",next,"TENANT_SUBSCRIPTION",Long.toString(id),
            "Subscription access changed by lifecycle enforcement.",Map.of("status",old),Map.of("status",next)));
    }
    private boolean ended(Map<String,Object> r,String name,LocalDate today,boolean inclusive) {
        Object value=r.get(name); if(value==null) return false;
        LocalDate end=value instanceof LocalDate d?d:((java.sql.Date)value).toLocalDate();
        return inclusive?today.isAfter(end):!today.isBefore(end);
    }
}
