# Production review remediation — 13 November 2026

This records the remediation of the findings in [the original review](production-review-2026-11-13.md). That review and its original evidence remain unchanged. Code changes and local checks do not constitute a production, legal, accessibility, or app-store certification.

## Changes by finding

| Finding | Implemented remediation |
| --- | --- |
| F01 | Serialize all financial writes under a tenant database lock before reading balances; concurrent independent payments tested against MySQL. A read-only reconciliation query detects historical discrepancies. |
| F02 | Require payment intent keys at the API; web preserves the same key across an uncertain retry, including when browser storage is unavailable. |
| F03 | Mobile uses the server's title/message fields, displays creation time when unsent, and links related trips. |
| F04 | Null-tolerant optional organization address formatting, exercised through the HTTP API. |
| F05 | Cross-tab browser locking for cookie operations; reject overlapping refresh reuse without revoking the successful session. Older replay still revokes sessions. |
| F06 | Normalize unavailable negative iOS speed/heading to null while retaining valid coordinates; regression tested. |
| F07 | Create linked outbound and return journeys atomically, each with independent resources, statuses, milestones, events and access-scoped detail. Show the pair in admin and mobile detail. |
| F08 | Project queued milestones locally, explicitly distinguish pending from dispatch-confirmed status, preserve dependency order through retries/conflicts, and offer discard/retry controls. |
| F09 | Stop location sharing immediately on a locally confirmed offline terminal milestone. |
| F10 | Enforce ride creation/round-trip settings, invoice override/tax policy and document prefixes. Mandatory compliance controls are visibly locked on. |
| F11 | Require the ride's original version on edit; return 409 for stale edits and 428 when missing. |
| F12 | Revalidate recurring references and operating policy at generation; reject invalid or ambiguous tenant-local DST times. |
| F13 | Lock schedule generation, cap its window at 366 days and enforce occurrence limits during generation. |
| F14 | Treat unknown drop-off as an open-ended resource reservation instead of inventing a two-hour duration. Dispatch must enter a reliable end time to free the resource. |
| F15 | Evaluate driver, vehicle and tenant compliance expiry using the tenant's operating date. |
| F16 | Replace shared codes with per-account encrypted TOTP, replay protection, password-confirmed enrollment/disable, single-use recovery codes, auditing and session revocation. Web and mobile accept MFA codes. |
| F17 | External static maps load only after an explicit user action with location-sharing disclosure. |
| F18 | Disabled providers return unsuccessful delivery; jobs record SKIPPED, never SENT. Production startup and deployment preflight reject disabled/logging delivery. |
| F19 | Upgrade vulnerable dependencies, add automated npm/Maven checks and a targeted deepmerge patch. Exact-version, expiring assessments cover two unreachable Spring view features guarded at startup. See security notes below. |
| F20 | Server search for rider, contract, area, driver and vehicle selectors; preserve currently selected records beyond the first result page. |
| F21 | Debounce and suppress obsolete list/search responses in the affected management screens. |
| F22 | Surface reference-load, save and conflict errors; retain drafts and offer recovery actions in affected forms. |
| F23 | Aggregate the complete authorized invoice ledger in the database, separately by currency; never add unlike currencies. |
| F24 | Add bounded client-event ingestion, rate limiting, privacy-preserving event identifiers and web/mobile recovery boundaries. Operations must collect and alert on server logs. |
| F25 | Repair mobile lint, run it in CI, verify the dependency patch and add Android/iOS native compilation jobs. |
| F26 | Preserve expected 404/405/409/428 protocol and conflict responses. |
| F27 | Remove the ineffective apply-immediately control while editing; use the explicit Apply action. |
| F28 | Resolve portal detail overdue status against tenant date using the same policy as invoice lists. |

## Linked journey and billing behavior

A new round-trip booking becomes two ONE_WAY rides joined by reciprocal IDs and OUTBOUND/RETURN labels. The return reverses the addresses and uses the entered return schedule. Its driver and vehicle start unassigned. Completion or cancellation of one leg does not complete or cancel the other; dispatch must manage both. Each leg is billed independently under applicable one-way pricing. Verify tenant contracts/pricing before accepting new round-trip bookings; a round-trip fare is not silently duplicated or divided.

Existing historical round trips are not rewritten automatically. Eligible pre-departure records have an explicit split action. Unsplit legacy round trips cannot depart; review them before rollout. Review existing invoices before splitting an already billed legacy booking to avoid duplicate charges. Migration creates links and MFA columns without creating synthetic historical milestones.

## Security and configuration notes

- Back up a newly generated, random 32-byte `APP_SECURITY_MFA_ENCRYPTION_KEY` securely. The deployment validator requires valid Base64 encoding. Losing/changing the key makes enrolled authenticator secrets unreadable. Never put it in git or application logs.
- Enroll privileged users and save their recovery codes before enabling `APP_AUTH_REQUIRE_MFA_FOR_PRIVILEGED_ACCOUNTS`. The policy rejects unenrolled privileged sign-in/refresh. Enrollment and disable revoke sessions.
- Production requires enabled Microsoft Graph email and Expo push. Supply actual provider credentials using secret storage. Configuration checks do not prove provider delivery; use controlled test recipients/devices in staging.
- The mobile deepmerge patch blocks prototype-related keys for source and target merges; postinstall fails if the patch no longer applies. Raw npm audit still reports the upstream low-severity advisory chain, despite the local mitigation. The explicit patch check is required.
- Two Spring MVC advisories involve XSLT views and SSE view fragments that this JSON API does not use. `security/maven-advisory-assessments.json` records exact-version, time-limited assessments; `ApiOnlyMvcValidator` fails startup if those view capabilities are introduced. These are mitigated/non-applicable assessments, not upstream fixes. The scanner fails on expired or untriaged assessments.
- Client event ingestion deliberately excludes exception messages, payloads, URLs and personal data. Forward server logs to durable monitoring and configure alerts; ingestion alone is not an on-call system.

## Rollout and outstanding external verification

Deploy compatible web/mobile clients with the API changes: ride edits require If-Match and payment creation requires Idempotency-Key. Apply V14/V15 through the normal Flyway path after backup. Validate migration from a restored copy of the actual production schema; do not run dev fixtures against production. Reconcile historical invoice balances with `deployment/aws/reconcile-invoice-balances.sql` and investigate discrepancies before changing ledger data.

Before release, perform the original review's observed desktop/narrow-screen/device/accessibility matrix, staging provider delivery, signed store installation, background tracking/airplane-mode/force-stop testing, load and worker recovery tests, and coordinated database/file restore. Confirm actual retention/deletion, privacy notices, external recipients, support ownership and applicable operating agreements. These require the real release environment and operating decisions; repository checks cannot substitute for that evidence.
