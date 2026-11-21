# Invoice integrity

Invoice generation requires an `Idempotency-Key` header (1–120 ASCII letters, digits, `.`, `_`, `:`, `-`). Keep the same key and unchanged request after an uncertain response. The same authenticated user and tenant receive the original invoice on replay; changed payloads return HTTP 409. A failed transaction rolls back the claim. Keys are retained without automatic expiry. Different users still cannot bill the same ride twice.

The admin client stores only a request digest and random key in session storage, with an in-memory fallback. It preserves them on failure and clears them after success. No request details are stored. Clearing browser storage can lose retry identity for invoices without ride references; API integrations must persist their intent keys.

A ride can appear once across all non-void invoices, including drafts. Checks apply to preview, generation, line-item additions/edits and issue. A database generated column derives `active_ride_id` from each line’s source and active-claim flag; its tenant-scoped unique constraint arbitrates concurrent writers. The flag defaults to active for new lines. The void operation releases claims in the same transaction as the invoice status change. Voided invoices cannot be reopened through the API; external database maintenance must preserve this invariant. Non-ride sources can recur in different billing periods. Voiding releases ride claims without deleting historical lines. Removing or changing a draft line also releases its old ride.

## Deployment

V22 validates existing data before enabling these constraints. Run this query before deployment and resolve each result through authorized financial review:

```sql
SELECT li.tenant_id, li.source_reference_id, COUNT(*) AS duplicate_lines
FROM invoice_line_items li JOIN invoices i ON i.id = li.invoice_id
WHERE li.charge_source_type = 'RIDE' AND i.status <> 'VOID'
GROUP BY li.tenant_id, li.source_reference_id HAVING COUNT(*) > 1;
```

Also inspect ride charges with missing source references and line/invoice tenant mismatches. The migration deliberately fails on invalid history; it does not void invoices or discard amounts automatically. MySQL DDL is not transactional: if migration fails, repair the financial data and reconcile completed V22 DDL with a DBA before Flyway repair/retry. Deploy backend and admin client together because generation now requires the header. Existing invoices and invoice numbers remain unchanged. These controls cannot detect a ride disguised as a generic manual charge without its ride reference.
