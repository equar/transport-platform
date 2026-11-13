-- Read-only diagnostic. Run against an approved database snapshot before any correction.
-- A discrepancy does not prove which payment was intended; investigate duplicate entries too.
SELECT i.tenant_id, i.id AS invoice_id, i.invoice_number, i.status,
       i.amount_paid AS recorded_amount_paid,
       COALESCE(p.expected_paid, 0) AS ledger_amount_paid,
       i.balance_due, i.total_amount - COALESCE(p.expected_paid, 0) AS ledger_balance_due
FROM invoices i
LEFT JOIN (
    SELECT tenant_id, invoice_id, SUM(amount) AS expected_paid
    FROM payments WHERE status IN ('APPLIED', 'PARTIALLY_APPLIED')
    GROUP BY tenant_id, invoice_id
) p ON p.tenant_id = i.tenant_id AND p.invoice_id = i.id
WHERE ABS(i.amount_paid - COALESCE(p.expected_paid, 0)) > 0.004
   OR ABS(i.balance_due - (i.total_amount - COALESCE(p.expected_paid, 0))) > 0.004;
