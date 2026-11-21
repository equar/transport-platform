# Medium findings M1–M14 remediation

This change addresses the medium findings in the supplied review. It does not mark unrelated high findings as resolved or certify regulatory compliance. No live database or deployment was modified.

## Behavior and evidence

| Finding | Implemented behavior | Verification |
| --- | --- | --- |
| M1 | All profiles require an external JWT signing secret; shipped development placeholders are rejected everywhere. | Configuration validator tests; application startup in isolated integration tests. |
| M2 | Temporary passwords expire in 24 hours, including bootstrap, owner provisioning, creation, reset and update. Missing expiry fails closed. | Bootstrap/provisioning tests and temporary-password login regression. |
| M3 | Refresh refuses temporary-password sessions and revokes their refresh credentials. | HTTP login/refresh regression. |
| M4 | Production requires privileged MFA. Unenrolled platform/tenant administrators receive an enrollment-only session; API and web workspace enforce it. Enrollment and recovery-code handling remain available. | HTTP password-only restriction, enrollment/activation, TOTP login and workspace access; web route regression. |
| M5 | Demo data is disabled by default. Explicit `app.dev-seed.enabled=true` works only in local/dev, never prod. | Fresh production-schema migrations and explicitly enabled integration fixtures. |
| M6 | Financial writes persist OVERDUE; a tenant-local scheduled aging worker reconciles existing receivables. Effective status filters exclude overdue rows from current issued/part-paid results before reconciliation. | MySQL aging/filter/partial-payment regression and financial unit tests. |
| M7 | V17 is preserved as applied migration history. V24 queues untouched migration-era approvals without a human approval audit for review, retaining the previous amount/status. Earnings get tenant/driver/ride/invoice foreign keys and EARNED requires a ride. | Upgrade test from V16 through V17/V23/V24 preserves actual human approval and requeues the unreviewed row. |
| M8 | GPS samples must be recent, chronological and at least five seconds apart per driver. Latest live locations are unavailable after travel ends. Raw trails expire after 30 days by default, with platform/tenant overrides, bounded cleanup, legal holds and preservation of milestone evidence samples. | MySQL upload/status/retention/legal-hold/evidence regressions. |
| M9 | Driver qualifications and verified-document dates must agree. Incomplete training or invalid qualifications block dispatch. Verification synchronizes related qualification fields. Scheduled issue sync runs every five minutes; critical issues cannot be dismissed. | Qualification consistency regression, existing dispatch/document/compliance tests. |
| M10 | Void/replacement invoice basis invalidates earnings approval. Pending entries recalculate for review; approval checks current invoice basis and delivery evidence. Approved historical rates are preserved. Round-trip legs share the original total quote. | Earnings void/replacement and odd-cent round-trip regressions. |
| M11 | Driver action retry keys are mandatory, tenant/user scoped, serialized with writes and store the encrypted original result. Replays reauthorize access. Web keys survive reload; mobile offline queue uses its durable action ID. | Stored-result replay, concurrent duplicate, mandatory-key and existing assignment/driver tests. |
| M12 | Committed audits have an HMAC-signed per-scope chain. Authorized retention adds signed deletion evidence. Verification checks changes, gaps, deletions and an optional independent checkpoint. Failed write attempts emit payload-free security telemetry outside the transaction. | MySQL tamper/retention/checkpoint regressions; audit/privacy tests. See deployment requirement below. |
| M13 | Manual partial/full refunds retain original receipts and reopen invoice balances. Future-invoice credit notes have controlled issuance, same-account/currency application, reversal and unused-note voiding. All adjustment writes are serialized, idempotent and audited; credit is excluded from cash collected. | Refund/credit replay, overdraw, concurrent spending, currency, reversal and receipt-preservation regressions; account-scoped web retry test. |
| M14 | The invoice tenant helper requires an authenticated company context matching its argument. | MySQL foreign-tenant and platform-scope denial regression. |

## Deployment and operating requirements

1. Supply `APP_SECURITY_JWT_SECRET` in every environment. There is no working development fallback. Keep MFA/privacy keys outside the repository. Existing `temp` placeholders are not valid keys.
2. Production requires `APP_AUTH_REQUIRE_MFA_FOR_PRIVILEGED_ACCOUNTS=true`. An explicitly configured false value now blocks deployment/startup. Administrators without an enrolled authenticator are directed to enrollment before entering the workspace. Maintain recovery codes securely.
3. Take a verified backup and run normal Flyway migrations including V24. Follow [the privacy migration runbook](phi-protection.md) with the updated `privacy-columns.csv`; driver-action response snapshots and refund/credit reasons are now protected inventory. Re-run the offline encryption/readiness process rather than carrying forward an old inventory stamp.
4. Review `earnings_legacy_reviews` and pending earnings. Recalculate a legacy entry against its current issued invoice, verify the evidence and approve deliberately. The migration never invents fares, evidence or human approvals.
5. Forward `AUDIT_CHECKPOINT` and `SECURITY_MUTATION_REJECTED` logs to independently controlled, access-restricted, immutable storage. Preserve scope, sequence and signature. The audit page/API can verify against a checkpoint retrieved from that storage. The database chain detects record edits and missing interior history; process memory also detects rollback during a running process. **Without an independent trusted checkpoint, complete/tail rollback across server restart cannot be ruled out.** Provisioning a cloud log destination or retention lock is an operator deployment action, not performed by this repository change. Retain the independent privacy lookup key: audit signatures derive a purpose-specific HMAC key from it and changing it invalidates verification of existing evidence.
6. Set the GPS retention period under platform/tenant privacy settings. Default raw trail retention is 30 days even when audit/notification cleanup is disabled. Legal holds override cleanup. Milestone evidence samples are retained with trip evidence. No automatic rider/trip-record deletion is introduced.
7. Refunds record money already returned; they do not call a payment provider. Credits are future-invoice vouchers, not a reduction of the original invoice or an automatic bank refund. Operators must provide the actual refund reference and reason. Voucher applications must use the same bill-to account and currency.

Worker intervals are configurable: `app.billing.aging.interval-ms` (900000), `app.compliance.sync.interval-ms` (300000), and `app.location.retention.interval-ms` (60000). Workers process companies separately and log failures without record contents. Test timers are disabled and worker methods are invoked explicitly.

## Validation completed

- Complete backend run followed by clean compilation and focused regression reruns. Latest results across the suite cover **417 tests, zero failures/errors, zero skipped**; the earlier fixture failures were resolved and rerun. MySQL 8 Testcontainers exercised fresh and V16-to-V24 upgrade paths, HTTP MFA/temporary-password boundaries, financial retries/concurrency, audit verification and retention, scheduled compliance, GPS controls and linked trip completion.
- Web: **130 tests passed** across 42 files; public/admin production builds and build-isolation checks passed.
- Mobile: type check and **nine offline-queue tests passed**. A native device build was not performed for this API-contract change.
- Deployment configuration: **25 Python tests passed**.
- Shared API contracts regenerated from the tested backend's OpenAPI response; final web/mobile type checks and `git diff --check` passed.

Backend verification used an isolated source copy to avoid interference from editor compilation. These are local/disposable-database checks; production migration, key custody, log forwarding and immutable checkpoint retention still require deployment verification.
