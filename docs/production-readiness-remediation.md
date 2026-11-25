# Production readiness remediation

Payments remain manual, in USD. No processor, merchant credentials, webhooks or bank transfers are activated by this change.

## Approved financial policies

- Driver commission uses gross service charges. Route prices are allocated equally to completed trips; any remainder cents go to the first completed trips in trip-ID order. Failed/cancelled/no-show trips receive no allocation. Each completed trip’s commission is rounded independently to cents.
- Subsequent credits and refunds do not silently reprice commission. A tenant administrator records an explicit earnings adjustment.
- The final terminal trip automatically completes an in-progress route. Automatic invoicing requires at least one completed trip and a selected route price/billing account. A route with no completed trips generates no automatic invoice.
- Driver payouts record funds already paid outside Bakaroo. Approved earnings cap outstanding payouts; payout allocations and reversals preserve history.
- Subscription refunds record money already returned outside Bakaroo. They reopen the invoice balance. Cancelling the charge requires a separate credit. Incorrect manual receipts can be reversed; credits can be reversed. Original receipts and charges remain visible.

## Review findings addressed

| Finding | Implementation |
| --- | --- |
| Fractional-cent totals | Normalize each line to cents before totaling and persistence; validate monetary precision and bounds. |
| Negative invoices | Reject excessive discounts/negative totals; zero-charge issued invoices settle without a fictitious payment. |
| Route/trip double billing | Shared coverage validation, current-read conflict checks, route claims and unique active trip allocations. |
| Route tax/terms | Shared invoice policy applies tenant tax and default due days. |
| Route earnings | Persist route-to-trip allocations; reconcile earnings on issue, void and explicit historical allocation reconciliation. |
| Earnings races | Invoice and earnings writes share the finance lock; ledger rows are versioned. |
| Missing document evidence | Verification loads readable PDF/image evidence and records its SHA-256; metadata endpoints cannot replace attachments. Vehicle upload/preview follows the same protected flow. |
| Stale document reviews | Versioned metadata and review requests reject stale changes with HTTP 409. |
| Timezone changes | Prevent service-zone changes after any trip, route or recurring schedule exists. Calendar dates remain date-only; individual/recurring wall-clock schedules retain DST validation. |
| Mixed business dates | Tenant-local document expiry, web billing defaults/displays and mobile timestamps. Mobile initializes/caches its service timezone before rendering account screens. |
| Manual source references | Resolve sources/pricing rules within the tenant and check trip payer alignment, including draft edits and invoice issuance. |
| Unsafe financial retries | Required receipt creation key; durable account-scoped retry keys for earnings adjustments, payouts and subscription corrections. |
| Payout accounting | Manual payout history, approved/paid/outstanding balances, allocations, reversals and CSV export. |
| Subscription corrections | Immutable refund/reversal/credit history with bounded amounts and idempotent writes. |
| Proxy deployment gap | Frontend releases render/apply the reviewed Nginx template, validate it, reload and restore previous proxy/assets on failure. |
| Zero rounded adjustments | Enforce two-decimal earnings adjustments and validate the final normalized nonzero amount. |

## Rollout and historical reconciliation

Backend, generated contracts and web changes belong in the same release. Migration V30 adds versions, evidence hashes, financial allocations/claims, payout tables and subscription correction records. It does not overwrite historical invoice amounts, delete duplicate charges, or fabricate verification evidence.

Tenant administrators/billing administrators can run **Receivables → Financial reconciliation**. The report is tenant-scoped and read-only, returning up to 200 exceptions per category with JSON export:

1. Review invoice total discrepancies, invalid service references, payer/source mismatches and overlapping route/trip charges. Resolve duplicates through explicit void/refund/rebilling workflows; do not edit issued financial history directly.
2. Review route invoices missing earnings allocations. **Reconcile allocations** validates ownership, duplicate coverage and completed-trip evidence before allocating gross charges and recalculating earnings. It does not change customer charges. Overlapping legacy invoices must be resolved first.
3. Review approved earnings with invalid source invoices and payout overages. Resolve through reviewed earnings adjustments or payout reversals.
4. Review drivers/vehicles marked non-compliant due to missing evidence. Upload actual evidence, complete metadata and review the current version. A synthetic metadata-only VERIFIED flag no longer establishes dispatch readiness.

The timezone restriction requires a separate planned migration if an established tenant must change service zones. It deliberately avoids silently reinterpreting existing bookings.

TLS certificate provisioning remains a web-host setup prerequisite. Routine frontend deployment applies proxy configuration without redeploying the backend. Existing application data and both document storage namespaces remain outside release directories.
