package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.common.exception.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** Commercial authorization is evaluated from current database state, never from JWT claims. */
@Service
public class TenantEntitlementService {
    public enum Resource {
        USERS("app_users", "max_users"), DRIVERS("drivers", "max_drivers"),
        VEHICLES("vehicles", "max_vehicles"), RIDERS("riders", "max_riders"),
        ORGANIZATIONS("organizations", "max_organizations");
        final String table, column;
        Resource(String table, String column) { this.table = table; this.column = column; }
    }
    public record Decision(Long subscriptionId, String state, String reason, Map<Resource, Integer> limits) {
        public boolean allowed() { return "ACTIVE".equals(state) || "TRIAL".equals(state); }
        public boolean paymentRestricted() { return "SUSPENDED".equals(state) && reason.equals("The subscription has an overdue unpaid invoice."); }
    }
    private final JdbcTemplate db;
    private final Clock clock;
    public TenantEntitlementService(JdbcTemplate db, Clock clock) { this.db = db; this.clock = clock; }
    public LocalDate today() { return LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC); }

    public Decision evaluate(String tenant) { return evaluate(tenant, false, false); }
    private Decision evaluate(String tenant, boolean lock, boolean onboarding) {
        var rows = db.queryForList("SELECT s.*,t.status AS tenant_status,p.max_users,p.max_drivers,p.max_vehicles,p.max_riders,p.max_organizations FROM tenant_subscriptions s JOIN tenants t ON t.id=s.tenant_id JOIN subscription_plans p ON p.id=s.subscription_plan_id WHERE s.tenant_id=? AND s.effective_start_date<=? ORDER BY s.effective_start_date DESC,s.id DESC LIMIT 1" + (lock ? " FOR SHARE" : ""), tenant, today());
        if (rows.isEmpty()) return new Decision(null, "UNAVAILABLE", "No effective subscription is assigned.", Map.of());
        var r = rows.getFirst();
        long id = ((Number) r.get("id")).longValue();
        var limits = new EnumMap<Resource, Integer>(Resource.class);
        for (var resource : Resource.values()) limits.put(resource, ((Number) r.get(resource.column)).intValue());
        String status = (String) r.get("status");
        String reason = "Subscription access is available.";
        if (!Set.of("ACTIVE", "TRIAL").contains(status)) reason = "The subscription is " + status.toLowerCase(Locale.ROOT) + ".";
        else if (date(r, "effective_end_date") != null && !today().isBefore(date(r, "effective_end_date"))) {
            status = "EXPIRED"; reason = "The subscription term has ended.";
        } else if ("TRIAL".equals(status) && (date(r, "trial_end_date") == null || today().isAfter(date(r, "trial_end_date")))) {
            status = "EXPIRED"; reason = "The subscription trial has ended.";
        } else if ("ACTIVE".equals(status) && date(r, "renewal_date") == null && date(r, "effective_end_date") == null) {
            status = "UNAVAILABLE"; reason = "The subscription requires a renewal or term end date.";
        } else if (date(r, "renewal_date") != null && today().isAfter(date(r, "renewal_date"))) {
            status = "EXPIRED"; reason = "The subscription renewal is overdue.";
        }
        if (Set.of("ACTIVE", "TRIAL").contains(status) && hasOverdueBalance(tenant, lock)) {
            status = "SUSPENDED"; reason = "The subscription has an overdue unpaid invoice.";
        }
        if (!"ACTIVE".equals(r.get("tenant_status")) && !(onboarding && "PENDING".equals(r.get("tenant_status")))) {
            status = "UNAVAILABLE"; reason = "The company workspace is not active.";
        }
        return new Decision(id, status, reason, Collections.unmodifiableMap(limits));
    }
    private LocalDate date(Map<String,Object> row, String key) {
        Object value = row.get(key);
        return value == null ? null : value instanceof LocalDate d ? d : ((java.sql.Date) value).toLocalDate();
    }
    public boolean hasOverdueBalance(String tenant) { return hasOverdueBalance(tenant, true); }
    private boolean hasOverdueBalance(String tenant, boolean lock) {
        return db.queryForObject("SELECT COUNT(*) FROM platform_subscription_invoices WHERE tenant_id=? AND status='ISSUED' AND paid_amount+credited_amount<amount AND due_date<?" + (lock ? " FOR SHARE" : ""), Long.class, tenant, today()) > 0;
    }
    public void requireOperational(String tenant) {
        // HTTP authorization is evaluated before domain transactions by the request filter.
        Decision decision = evaluate(tenant, false, false);
        if (!decision.allowed()) throw denied(decision.reason());
    }
    public boolean isPaymentRestricted(String tenant) { return evaluate(tenant).paymentRestricted(); }

    public void requireLoginAccess(com.transportplatform.tms.features.auth.domain.AppUser user) {
        Decision decision = evaluate(user.getTenantId());
        boolean recoveryRole = user.getRoles().stream().anyMatch(role -> java.util.Set.of(
                "ROLE_TENANT_ADMIN", "ROLE_BILLING_ADMIN", "ROLE_DRIVER").contains(role.name()));
        if (!decision.allowed() && !(decision.paymentRestricted() && recoveryRole)) throw denied(decision.reason());
    }

    public void requireRequestAccess(com.transportplatform.tms.common.security.AuthenticatedUser user, String method, String path) {
        Decision decision = evaluate(user.tenantId());
        if (decision.allowed()) return;
        if (decision.paymentRestricted()) {
            boolean finance = user.getAuthorities().stream().anyMatch(a -> java.util.Set.of("ROLE_TENANT_ADMIN", "ROLE_BILLING_ADMIN").contains(a.getAuthority()));
            boolean driver = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
            if (path.equals("/v1/auth/logout") || path.equals("/v1/auth/status") || path.equals("/v1/auth/change-password")
                    || path.matches("/v1/auth/mfa(/.*)?") || ("GET".equals(method) && java.util.Set.of("/runtime/tenant-capabilities", "/runtime/tenant-branding").contains(path))) return;
            if (finance && "GET".equals(method) && path.matches("/company/subscription-billing(/.*)?")) return;
            if (driver && "GET".equals(method) && java.util.Set.of("/portal/driver/rides", "/portal/driver/dashboard", "/portal/driver/profile").contains(path)) return;
            if (driver && ("GET".equals(method) || "POST".equals(method))) {
                var match = java.util.regex.Pattern.compile("^/portal/driver/rides/([0-9]+)(?:/(location-history|location-snapshot|location-snapshots|notes|actions/(?:driver-en-route|arrived|picked-up|dropped-off|complete|no-show|failed)))?$").matcher(path);
                if (match.matches()) {
                    long rideId;
                    try { rideId = Long.parseLong(match.group(1)); } catch (NumberFormatException invalid) { throw denied(decision.reason()); }
                    Long count = db.queryForObject("SELECT COUNT(*) FROM rides r JOIN portal_user_scopes p ON p.tenant_id=r.tenant_id AND p.portal_subject_type='DRIVER' AND p.portal_subject_id=r.driver_id WHERE r.tenant_id=? AND p.app_user_id=? AND r.id=? AND r.status IN ('DRIVER_EN_ROUTE','ARRIVED','PICKED_UP','DROPPED_OFF','COMPLETED','RIDER_NO_SHOW','FAILED')", Long.class, user.tenantId(), user.id(), rideId);
                    if (count != null && count > 0) return;
                }
            }
        }
        throw denied(decision.reason());
    }
    public void lockTenant(String tenant) {
        if (db.queryForList("SELECT id FROM tenants WHERE id=? FOR UPDATE", tenant).isEmpty()) throw denied("Company was not found.");
    }
    /** All retained records count. Editing/reactivation consumes no additional capacity. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void requireCapacity(String tenant, Resource resource) {
        requireCapacity(tenant, resource, false);
    }
    @Transactional(propagation = Propagation.MANDATORY)
    public void requireOwnerCapacity(String tenant) { requireCapacity(tenant, Resource.USERS, true); }
    private void requireCapacity(String tenant, Resource resource, boolean onboarding) {
        lockTenant(tenant);
        Decision decision = evaluate(tenant, true, onboarding);
        // Owner provisioning happens while the company is PENDING approval. Its plan cap still applies.
        if (!decision.allowed()) throw denied(decision.reason());
        int limit = decision.limits().get(resource);
        long used = db.queryForObject("SELECT COUNT(*) FROM " + resource.table + " WHERE tenant_id=? FOR UPDATE", Long.class, tenant);
        if (used >= limit) throw new ApiException(ErrorCode.RESOURCE_CONFLICT, HttpStatus.CONFLICT,
            "The subscription plan limit for " + resource.name().toLowerCase(Locale.ROOT) + " has been reached (" + used + "/" + limit + "). Contact the platform administrator to increase the limit.");
    }
    private ApiException denied(String reason) {
        return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
            reason + " Contact the platform administrator to restore subscription access.");
    }
}
