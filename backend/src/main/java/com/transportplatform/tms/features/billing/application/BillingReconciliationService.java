package com.transportplatform.tms.features.billing.application;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only, tenant-scoped exception report. Historical charges are never repaired implicitly. */
@Service
public class BillingReconciliationService {
    private final BillingAccessService access; private final JdbcTemplate db;
    public BillingReconciliationService(BillingAccessService access,JdbcTemplate db) { this.access=access;this.db=db; }
    @Transactional(readOnly=true)
    public Map<String,List<Map<String,Object>>> report() {
        String tenant=access.requireCompanyTenantId();
        var result=new LinkedHashMap<String,List<Map<String,Object>>>();
        result.put("invoice_totals",db.queryForList("""
            SELECT i.id AS invoice_id,i.invoice_number,i.subtotal,COALESCE(t.lines_total,0) AS expected_subtotal,i.total_amount,i.balance_due
            FROM invoices i LEFT JOIN (
                SELECT invoice_id,tenant_id,SUM(line_amount) AS lines_total FROM invoice_line_items
                WHERE tenant_id=? GROUP BY invoice_id,tenant_id
            ) t ON t.tenant_id=i.tenant_id AND t.invoice_id=i.id
            WHERE i.tenant_id=? AND (i.subtotal<>COALESCE(t.lines_total,0)
              OR i.total_amount<>i.subtotal+i.tax_amount-i.discount_amount
              OR i.balance_due<>i.total_amount-i.amount_paid OR i.total_amount<0 OR i.balance_due<0) LIMIT 200
            """,tenant,tenant));
        result.put("overlapping_service_charges",db.queryForList("""
            WITH coverage AS (
                SELECT l.id,l.invoice_id,l.source_reference_id AS ride_id FROM invoice_line_items l JOIN invoices i ON i.id=l.invoice_id AND i.tenant_id=l.tenant_id WHERE l.tenant_id=? AND i.status<>'VOID' AND l.charge_source_type='RIDE'
                UNION
                SELECT l.id,l.invoice_id,s.ride_id FROM invoice_line_items l JOIN invoices i ON i.id=l.invoice_id AND i.tenant_id=l.tenant_id JOIN route_stops s ON s.tenant_id=l.tenant_id AND s.route_id=l.source_reference_id WHERE l.tenant_id=? AND i.status<>'VOID' AND l.charge_source_type='ROUTE'
            ) SELECT ride_id,COUNT(*) AS charge_count,GROUP_CONCAT(DISTINCT invoice_id ORDER BY invoice_id) AS invoice_ids FROM coverage GROUP BY ride_id HAVING COUNT(*)>1 LIMIT 200
            """,tenant,tenant));
        result.put("invalid_service_references",db.queryForList("""
            SELECT l.invoice_id,l.id AS line_item_id,l.charge_source_type,l.source_reference_id
            FROM invoice_line_items l JOIN invoices i ON i.id=l.invoice_id AND i.tenant_id=l.tenant_id
            LEFT JOIN rides r ON l.charge_source_type='RIDE' AND r.tenant_id=l.tenant_id AND r.id=l.source_reference_id
            LEFT JOIN routes rt ON l.charge_source_type='ROUTE' AND rt.tenant_id=l.tenant_id AND rt.id=l.source_reference_id
            WHERE l.tenant_id=? AND i.status<>'VOID' AND
              ((l.charge_source_type='RIDE' AND r.id IS NULL) OR (l.charge_source_type='ROUTE' AND rt.id IS NULL)) LIMIT 200
            """,tenant));
        result.put("payer_source_mismatch",db.queryForList("""
            SELECT l.invoice_id,l.id AS line_item_id,r.id AS ride_id,i.bill_to_type,i.bill_to_id
            FROM invoice_line_items l JOIN invoices i ON i.id=l.invoice_id AND i.tenant_id=l.tenant_id
            JOIN rides r ON l.charge_source_type='RIDE' AND r.tenant_id=l.tenant_id AND r.id=l.source_reference_id
            WHERE l.tenant_id=? AND i.status<>'VOID' AND NOT
              ((CASE i.bill_to_type WHEN 'RIDER' THEN r.rider_id WHEN 'GUARDIAN' THEN r.guardian_id
                WHEN 'ORGANIZATION' THEN r.organization_id WHEN 'CONTRACT' THEN r.contract_id END) <=> i.bill_to_id) LIMIT 200
            """,tenant));
        result.put("route_allocations_missing",db.queryForList("""
            SELECT l.invoice_id,l.id AS line_item_id,l.source_reference_id AS route_id FROM invoice_line_items l JOIN invoices i ON i.id=l.invoice_id AND i.tenant_id=l.tenant_id
            WHERE l.tenant_id=? AND i.status NOT IN ('DRAFT','VOID') AND l.charge_source_type='ROUTE'
              AND NOT EXISTS(SELECT 1 FROM invoice_ride_allocations a WHERE a.tenant_id=l.tenant_id AND a.line_item_id=l.id)
            LIMIT 200
            """,tenant));
        result.put("earnings_basis",db.queryForList("""
            SELECT e.id AS earnings_id,e.ride_id,e.source_invoice_id,e.amount FROM driver_earnings_ledger e
            LEFT JOIN invoices i ON i.tenant_id=e.tenant_id AND i.id=e.source_invoice_id
            WHERE e.tenant_id=? AND e.entry_type='EARNED' AND e.status='APPROVED'
              AND (i.id IS NULL OR i.status IN ('DRAFT','VOID') OR NOT EXISTS(SELECT 1 FROM invoice_ride_allocations a WHERE a.tenant_id=e.tenant_id AND a.invoice_id=e.source_invoice_id AND a.ride_id=e.ride_id AND a.claim_active=TRUE AND a.amount=e.invoice_total)) LIMIT 200
            """,tenant));
        result.put("payout_overages",db.queryForList("""
            SELECT d.id AS driver_id,COALESCE((SELECT SUM(e.amount) FROM driver_earnings_ledger e WHERE e.tenant_id=d.tenant_id AND e.driver_id=d.id AND e.status='APPROVED'),0) AS approved,
              (SELECT SUM(p.amount) FROM driver_payouts p WHERE p.tenant_id=d.tenant_id AND p.driver_id=d.id AND p.reversed_at IS NULL) AS paid
            FROM drivers d WHERE d.tenant_id=? HAVING paid>approved LIMIT 200
            """,tenant));
        return result;
    }
}
